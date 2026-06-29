import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";

interface SearchBarProps {
  data?: string;
  buildSearchUrl?: (query: string) => string;
}

const SearchBar = ({ data, buildSearchUrl }: SearchBarProps) => {
  const navigate = useNavigate();
  const [input, setInput] = useState<string>(data ?? "");

  useEffect(() => {
    setInput(data ?? "");
  }, [data]);

  const onSearchHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (buildSearchUrl) {
      navigate(buildSearchUrl(trimmed));
      return;
    }
    navigate("/course-list/" + trimmed);
  };

  return (
    <form
      name="form"
      onSubmit={onSearchHandler}
      className="max-w-xl w-full md:h-14 h-12 flex items-center bg-white border border-gray-500/20 rounded"
    >
      <img
        src={assets.search_icon}
        alt="search_icon"
        className="md:w-auto w-10 px-3"
      />
      <input
        type="text"
        placeholder="Search for courses"
        className="w-full h-full outline-none text-gray-500/80"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 rounded text-white md:px-10 px-7 md:py-3 py-2 mx-1"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
