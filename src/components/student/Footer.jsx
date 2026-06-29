import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <footer className="bg-gray-900 md:px-24 lg:px-36 text-left w-full mt-20">
      {/* Main Content Grid */}
      <div className="flex flex-col md:flex-row items-start px-8 md:px-0 justify-between gap-12 py-16 border-b border-white/10">
        
        {/* Brand Left Column */}
        <div className="flex flex-col items-center md:items-start md:max-w-md w-full">
          <div className="flex items-center gap-3 select-none">
            <img 
              src={assets.logo_dark} 
              alt="logo" 
              className="h-10 w-auto object-contain"
            />
            <span className="font-bold text-xl tracking-tight text-white">
              NexaLearn
            </span>
          </div>
          <p className="mt-5 text-center md:text-left text-sm text-gray-400 leading-relaxed">
            NexaLearn is an online learning platform that provides high-quality courses and resources to help individuals acquire new skills and knowledge. Our mission is to empower learners worldwide by offering accessible and engaging educational content. 
          </p>
        </div>

        {/* Navigation Right Column */}
        <div className="flex flex-col items-center md:items-start w-full md:w-auto">
          <h2 className="font-semibold text-white tracking-wider uppercase text-xs mb-5">
            Company
          </h2>
          <ul className="flex flex-col items-center md:items-start gap-3 text-sm text-gray-400 w-full">
            <li>
              <a href="#" className="hover:text-blue-400 transition-colors duration-200">Home</a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-400 transition-colors duration-200">About us</a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-400 transition-colors duration-200">Contact us</a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-400 transition-colors duration-200">Privacy policy</a>
            </li>
          </ul>
        </div>

      </div>

      {/* Sub-Footer Copyright Bar */}
      <div className="px-8 md:px-0 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} NexaLearn. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Cookies Settings</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
