/**
 * QuestionListItem - Single question row in the list
 */
function QuestionListItem({ question, onClick }) {
  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="question-list-item" onClick={() => onClick(question)}>
      <div className="question-list-item__content">
        <span className="question-list-item__text">
          {truncateText(question.text)}
        </span>
        <span className="question-list-item__category">
          {question.categoryName || 'Sin categoría'}
        </span>
      </div>
      <span className="question-list-item__arrow">›</span>
    </div>
  );
}

export default QuestionListItem;
