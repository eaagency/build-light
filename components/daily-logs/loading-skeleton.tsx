/**
 * Loading Skeleton Components
 * Placeholder components shown during async operations
 */

export function DailyLogCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>

      {/* Photos */}
      <div className="flex gap-2 mb-4">
        <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      </div>
    </div>
  );
}

export function TimelineLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <DailyLogCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PhotoGallerySkeleton() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"
        />
      ))}
    </div>
  );
}

export function FormLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Date field */}
      <div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Weather field */}
      <div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"
            />
          ))}
        </div>
      </div>

      {/* Text area */}
      <div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Photos */}
      <div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600" />
      </div>
    </div>
  );
}

export function TemplateCardSkeleton() {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
    </div>
  );
}

export function TemplatesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <TemplateCardSkeleton key={i} />
      ))}
    </div>
  );
}
