// Pagination Component
import React from 'react';
import { getPageNumbers } from '../utils/paginationUtils';
import '../styles/components/Pagination.css';

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  startIndex,
  endIndex,
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages) {
      onPageChange(totalPages);
    }
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing {startIndex} to {endIndex} of {totalItems} items
      </div>
      
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={handleFirst}
          disabled={currentPage === 1}
          title="First page"
        >
          «
        </button>
        
        <button
          className="pagination-btn"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          title="Previous page"
        >
          ‹
        </button>
        
        {pageNumbers[0] > 1 && (
          <>
            <button
              className="pagination-btn"
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="pagination-ellipsis">...</span>
            )}
          </>
        )}
        
        {pageNumbers.map(page => (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="pagination-ellipsis">...</span>
            )}
            <button
              className="pagination-btn"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          className="pagination-btn"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          ›
        </button>
        
        <button
          className="pagination-btn"
          onClick={handleLast}
          disabled={currentPage === totalPages}
          title="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
};

// Export as PaginationControls for backward compatibility with pagination.js imports
export const PaginationControls = Pagination;

export default Pagination;
