/**
 * Loading state for patients page.
 */

export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
                {/* Header skeleton */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="h-8 w-48 bg-gray-200 rounded"></div>
                        <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
                    </div>
                    <div className="h-10 w-32 bg-gray-200 rounded"></div>
                </div>

                {/* Search skeleton */}
                <div className="mb-6">
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>

                {/* Cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
