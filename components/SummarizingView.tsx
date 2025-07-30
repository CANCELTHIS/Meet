import React from 'react';
import Card from './Card';
import Icon from './Icon';

const SkeletonLine: React.FC<{ width: string; height?: string }> = ({ width, height = 'h-5' }) => (
  <div className={`bg-gray-700/80 rounded-md animate-pulse ${width} ${height}`}></div>
);

const SummarizingView: React.FC = () => {
  const spinnerIcon = (
    <svg className="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-center mb-4">
        <Icon icon={spinnerIcon} />
        <h2 className="text-2xl font-bold text-white ml-4">Generating Summary...</h2>
      </div>
      <p className="text-gray-400 mb-8 text-center">
        Our AI is analyzing the transcript to extract key points. This may take a moment.
      </p>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold text-white mb-4"><SkeletonLine width="w-48" height="h-6" /></h3>
          <div className="space-y-3 pl-5">
            <SkeletonLine width="w-11/12" />
            <SkeletonLine width="w-10/12" />
            <SkeletonLine width="w-full" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-4"><SkeletonLine width="w-56" height="h-6" /></h3>
          <div className="overflow-x-auto">
            <div className="w-full text-left">
              <div className="flex text-gray-400 font-semibold">
                  <div className="p-3 w-2/4"><SkeletonLine width="w-20" height="h-4" /></div>
                  <div className="p-3 w-1/4"><SkeletonLine width="w-16" height="h-4" /></div>
                  <div className="p-3 w-1/4"><SkeletonLine width="w-24" height="h-4" /></div>
              </div>
              <div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex border-b border-gray-700/50">
                    <div className="p-3 w-2/4"><SkeletonLine width="w-full" /></div>
                    <div className="p-3 w-1/4"><SkeletonLine width="w-10/12" /></div>
                    <div className="p-3 w-1/4"><SkeletonLine width="w-11/12" /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SummarizingView;
