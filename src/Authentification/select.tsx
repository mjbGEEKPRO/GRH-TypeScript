import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { AxiosError } from "axios";

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

interface Poste {
  id: number;
  nom: string;
}

const Select: React.FC<Props> = ({ value, onChange, error }) => {
  const [options, setOptions] = useState<Poste[]>([]);

  const charger = async () => {
    try {
      const res = await api.get("/api/postes");
      setOptions(res.data.postes);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.log(
        "Erreur reponse du serveur ",
        axiosError.response?.data?.message
      );
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const SelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selecteValue = e.target.value;
    onChange(selecteValue);
  };

  return (
    <div className="space-y-3">
      <select
        value={value}
        onChange={SelectChange}
        className={`w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm ${
          error ? "border-red-400 bg-red-500/10" : "hover:bg-white/15"
        }`}
      >
        <option value="" className="bg-gray-800 text-indigo-600">
          Sélectionner votre poste
        </option>
        {options.map((poste) => (
          <option
            key={poste.id}
            value={poste.nom}
            className="bg-gray-800 text-white"
          >
            {poste.nom}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-red-300 text-sm mt-2 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
