"use client";

import { useState } from "react";

interface UserProfileFormProps {
  onSubmit: (formData: {
    name: string;
    age: string;
    location: string;
    householdSize: string;
    preferredStore: string;
  }) => Promise<void>;
  isLoading?: boolean;
  initialData?: {
    name: string;
    age: string;
    location: string;
    householdSize: string;
    preferredStore: string;
  };
}

export default function UserProfileForm({
  onSubmit,
  isLoading = false,
  initialData
}: UserProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    age: initialData?.age || "",
    location: initialData?.location || "",
    householdSize: initialData?.householdSize || "",
    preferredStore: initialData?.preferredStore || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="age"
            className="block text-sm font-medium text-gray-700"
          >
            Age
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="18"
            max="120"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location (City, State)
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="householdSize"
            className="block text-sm font-medium text-gray-700"
          >
            Household Size
          </label>
          <input
            type="number"
            id="householdSize"
            name="householdSize"
            value={formData.householdSize}
            onChange={handleChange}
            min="1"
            max="20"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="preferredStore"
            className="block text-sm font-medium text-gray-700"
          >
            Preferred Grocery Store
          </label>
          <select
            id="preferredStore"
            name="preferredStore"
            value={formData.preferredStore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Select a store</option>
            <option value="Walmart">Walmart</option>
            <option value="Target">Target</option>
            <option value="Whole Foods">Whole Foods</option>
            <option value="Trader Joe's">Trader Joe's</option>
            <option value="Kroger">Kroger</option>
            <option value="Costco">Costco</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {isLoading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
