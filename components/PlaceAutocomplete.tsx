"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon?: "origin" | "destination";
}

export default function PlaceAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  icon = "origin",
}: PlaceAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSelected, setIsSelected] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize AutocompleteService when Google Maps is ready
  const initService = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.google?.maps?.places?.AutocompleteService &&
      !serviceRef.current
    ) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  useEffect(() => {
    // Try immediately, then poll until Maps JS loads
    initService();
    if (!serviceRef.current) {
      const interval = setInterval(() => {
        initService();
        if (serviceRef.current) clearInterval(interval);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [initService]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchPredictions = useCallback((query: string) => {
    if (!serviceRef.current || query.length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    serviceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: "us" },
        // Bias toward Hawaii
        location: new window.google.maps.LatLng(21.3069, -157.8583),
        radius: 100000, // 100km around Honolulu
        types: ["geocode", "establishment"],
      },
      (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          setPredictions(results as unknown as Prediction[]);
          setIsOpen(true);
          setActiveIndex(-1);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      }
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    setIsSelected(false);

    // Propagate raw text immediately so form validation still works
    onChange(query);

    // Debounce API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(query), 220);
  };

  const handleSelect = (prediction: Prediction) => {
    const fullAddress = prediction.description;
    setInputValue(fullAddress);
    onChange(fullAddress);
    setIsSelected(true);
    setPredictions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(predictions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
        {label}
      </label>

      <div className="relative">
        {/* Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {icon === "origin" ? (
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 bg-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
          ) : (
            <svg
              className="w-5 h-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-10 pr-4 py-3 rounded-xl border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent placeholder-slate-300 transition ${
            isSelected
              ? "border-blue-300 bg-blue-50"
              : "border-slate-200 bg-white"
          }`}
          required
        />

        {/* Clear button */}
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              onChange("");
              setIsSelected(false);
              setPredictions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {predictions.map((prediction, i) => (
            <button
              key={prediction.place_id}
              type="button"
              onMouseDown={(e) => {
                // Prevent input blur before click fires
                e.preventDefault();
                handleSelect(prediction);
              }}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition border-b border-slate-50 last:border-0 ${
                i === activeIndex
                  ? "bg-blue-50"
                  : "hover:bg-slate-50"
              }`}
            >
              {/* Map pin icon */}
              <svg
                className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}

          {/* Powered by Google */}
          <div className="px-4 py-2 bg-slate-50 flex items-center justify-end gap-1">
            <span className="text-xs text-slate-300">powered by</span>
            <svg
              className="h-3 opacity-40"
              viewBox="0 0 120 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <text
                x="0"
                y="32"
                fontSize="32"
                fontFamily="Arial"
                fill="#4285F4"
                fontWeight="bold"
              >
                Google
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
