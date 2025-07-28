export default function PackDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Section Skeleton */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            {/* Title skeleton */}
            <div className="h-12 bg-gray-200 rounded-lg w-3/4 mb-4 animate-pulse"></div>
            
            {/* Rating and creator skeleton */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            
            {/* Location and pin count skeleton */}
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            
            {/* Categories skeleton */}
            <div className="flex flex-wrap gap-2 mt-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              ))}
            </div>
          </div>
          
          {/* Action buttons skeleton */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Gallery Skeleton */}
        <div className="relative mb-10">
          <div className="w-full flex gap-2 h-80 rounded-2xl overflow-hidden">
            {/* Main photo skeleton */}
            <div className="flex-1 bg-gray-200 animate-pulse"></div>
            
            {/* Right side 2x2 grid skeleton */}
            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description skeleton */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
              </div>
            </div>

            {/* Places skeleton */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse"></div>
              </div>
              
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-start space-x-4 p-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews skeleton */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
              
              <div className="space-y-6">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            
            {/* Booking card skeleton */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="text-center mb-6">
                <div className="h-10 bg-gray-200 rounded w-24 mx-auto mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
              </div>

              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Creator card skeleton */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="text-center">
                        <div className="h-5 bg-gray-200 rounded w-8 mx-auto mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar packs skeleton */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>

          <div className="overflow-x-auto">
            <div className="flex space-x-6 pb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex-none w-80">
                  <div className="h-48 bg-gray-200 rounded-2xl mb-4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 