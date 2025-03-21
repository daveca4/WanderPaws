'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

type ComponentProps = {
  node?: any;  // Add proper type for node
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;  // Allow any additional props
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm md:prose-base max-w-none ${className}`}>
      <ReactMarkdown 
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }: ComponentProps) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          h2: ({ node, ...props }: ComponentProps) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
          h3: ({ node, ...props }: ComponentProps) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
          h4: ({ node, ...props }: ComponentProps) => <h4 className="text-base font-bold mt-3 mb-2" {...props} />,
          h5: ({ node, ...props }: ComponentProps) => <h5 className="text-sm font-bold mt-3 mb-1" {...props} />,
          h6: ({ node, ...props }: ComponentProps) => <h6 className="text-xs font-bold mt-3 mb-1" {...props} />,
          p: ({ node, ...props }: ComponentProps) => <p className="mb-4" {...props} />,
          a: ({ node, ...props }: ComponentProps) => (
            <a 
              className="text-primary-600 hover:text-primary-800 underline" 
              rel="noopener noreferrer"
              {...props} 
            />
          ),
          ul: ({ node, ...props }: ComponentProps) => <ul className="list-disc pl-5 mb-4" {...props} />,
          ol: ({ node, ...props }: ComponentProps) => <ol className="list-decimal pl-5 mb-4" {...props} />,
          li: ({ node, ...props }: ComponentProps) => <li className="mb-1" {...props} />,
          blockquote: ({ node, ...props }: ComponentProps) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 py-2 mb-4 italic" {...props} />
          ),
          code: ({ node, inline, ...props }: ComponentProps) => (
            inline 
              ? <code className="bg-gray-100 rounded px-1 py-0.5" {...props} />
              : <code className="block bg-gray-100 rounded p-3 overflow-x-auto" {...props} />
          ),
          pre: ({ node, ...props }: ComponentProps) => <pre className="bg-gray-100 rounded-md p-4 overflow-x-auto mb-4" {...props} />,
          hr: ({ node, ...props }: ComponentProps) => <hr className="my-6 border-t border-gray-300" {...props} />,
          img: ({ node, ...props }: ComponentProps) => (
            <img 
              className="max-w-full h-auto rounded-md mx-auto my-4"
              loading="lazy"
              {...props} 
            />
          ),
          table: ({ node, ...props }: ComponentProps) => (
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-300" {...props} />
            </div>
          ),
          th: ({ node, ...props }: ComponentProps) => <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 bg-gray-50" {...props} />,
          td: ({ node, ...props }: ComponentProps) => <td className="px-3 py-4 text-sm text-gray-500 border-t border-gray-200" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 