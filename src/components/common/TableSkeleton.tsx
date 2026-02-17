import React from 'react';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  showAvatar?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns,
  rows = 5,
  showAvatar = false,
}) => {
  return (
    <div className="enterprise-card overflow-hidden animate-pulse mt-4">
      <div className="table-container">
        <table className="enterprise-table">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}>
                  <div className="h-4 bg-muted rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx}>
                    {colIdx === 0 && showAvatar ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full" />
                        <div className="h-4 bg-muted rounded w-24" />
                      </div>
                    ) : (
                      <div
                        className={`h-4 bg-muted rounded ${
                          colIdx === columns - 1 ? 'w-20' : 'w-16 sm:w-24'
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;