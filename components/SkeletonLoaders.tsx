import React from 'react';

export const DashboardSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Welcome & Stats Skeleton */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white dark:bg-gray-900 h-64 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm" />
        <div className="bg-white dark:bg-gray-900 h-64 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm" />
      </div>

      {/* Tools Bar Skeleton */}
      <div className="bg-white dark:bg-gray-900 h-16 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm mb-10" />

      {/* Tabs Skeleton */}
      <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800 mb-8 h-10" />

      {/* Grid Skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 h-[500px] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm" />
        ))}
      </div>
    </div>
  );
};

export const PublicViewSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] animate-pulse">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-900 h-64 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-8" />
        <div className="bg-white dark:bg-gray-900 h-[400px] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm" />
      </div>
    </div>
  );
};
