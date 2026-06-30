import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { assets } from "../../assets/assets";
import { getCourse } from "../../services/courseService";
import { createPaymentIntent, getPaymentStatus } from "../../services/paymentService";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#374151",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#dc2626" },
  },
};

const CheckoutForm = ({ course, clientSecret, paymentIntentId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | paying | polling | succeeded

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");
    setStatus("paying");

    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed.");
      setProcessing(false);
      setStatus("idle");
      return;
    }

    if (paymentIntent.status === "succeeded") {
      setStatus("succeeded");
      navigate("/my-enrollments");
      return;
    }

    setStatus("polling");
    const poll = async () => {
      try {
        const data = await getPaymentStatus(paymentIntentId);
        if (data.status === "succeeded") {
          setStatus("succeeded");
          navigate("/my-enrollments");
        } else if (data.status === "failed") {
          setError("Payment failed. Please try again.");
          setProcessing(false);
          setStatus("idle");
        } else {
          setTimeout(poll, 1500);
        }
      } catch {
        setTimeout(poll, 1500);
      }
    };
    poll();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <CardElement options={CARD_OPTIONS} />
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition text-sm"
      >
        {status === "paying" ? "Processing…" : status === "polling" ? "Confirming…" : `Pay ${course.basePrice.toFixed(2)}`}
      </button>
    </form>
  );
};

const CheckoutPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) return;

    const init = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getCourse(courseId);
        setCourse(data);

        const intent = await createPaymentIntent(courseId);
        setClientSecret(intent.clientSecret);
        setPaymentIntentId(intent.paymentIntentId);
      } catch (err) {
        setError(err.message || "Failed to initialize checkout.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-custom-card w-full max-w-lg px-8 py-10">
        <div
          className="flex items-center gap-3 mb-6 cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          <img src={assets.logo} alt="Logo" className="h-9 w-auto object-contain" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            NexaLearn
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Complete your purchase</h1>
        <p className="text-sm text-gray-500 mb-7">{course.title}</p>

        <div className="flex items-center justify-between py-4 border-y border-gray-200 mb-6">
          <span className="text-gray-700 font-medium">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            ${Number(course.basePrice).toFixed(2)}
          </span>
        </div>

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm course={course} clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
