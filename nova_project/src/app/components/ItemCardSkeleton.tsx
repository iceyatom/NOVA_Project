"use client";

export default function ItemCardSkeleton() {
  // Styles
  const itemCardStyle = {
    border: "1px solid #cccccc",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "2px 2px 12px rgba(0, 0, 0, 0.1)",
    width: "100%",
    height: "auto",
    minHeight: "fit-content",
  };

  const titleStyle = {
    color: "#000000",
    fontSize: "18px",
    backgroundColor: "#EEEEEE",
    borderRadius: "4px",
  };

  const imageSkeletonStyle: React.CSSProperties = {
    width: "100%",
    height: "auto",
    minHeight: "200px",
    maxHeight: "200px",
    display: "block",
    marginTop: "auto",
    marginBottom: "auto",
    borderRadius: "8px",
    border: "1px solid #EEEEEE",
    backgroundColor: "#EEEEEE",
  };

  const descriptionStyle = {
    fontSize: "14px",
    color: "#555555",
    marginTop: "8px",
    backgroundColor: "#EEEEEE",
    borderRadius: "4px",
  };

  const category3Style = {
    fontSize: "12px",
    color: "#555555",
    marginTop: "4px",
    backgroundColor: "#EEEEEE",
    borderRadius: "4px",
    width: "75%",
  };

  const category2Style = {
    fontSize: "12px",
    color: "#555555",
    marginTop: "4px",
    backgroundColor: "#EEEEEE",
    borderRadius: "4px",
    width: "75%",
  };

  const category1Style = {
    fontSize: "12px",
    color: "#555555",
    marginTop: "4px",
    backgroundColor: "#EEEEEE",
    borderRadius: "4px",
    width: "75%",
  };

  const costStyle = {
    fontSize: "12px",
    color: "#555555",
    marginTop: "4px",
    backgroundColor: "#EEEEEE",
    borderRadius: "4px",
    width: "25%",
  };

  const stockStyle = {
    fontSize: "12px",
    color: "#FF0000",
    marginTop: "4px",
    backgroundColor: "#EEEEEE",
    borderRadius: "4px",
    width: "50%",
  };

  // HTML
  return (
    <div className="item-card" style={itemCardStyle}>
      <h2 className="item-card-title" style={titleStyle}>
        &nbsp;
      </h2>
      <p className="item-card-image" style={imageSkeletonStyle} />
      <p className="item-card-description" style={descriptionStyle}>
        &nbsp;
        <br />
        &nbsp;
      </p>
      <p className="item-card-category3" style={category3Style}>
        &nbsp;
      </p>
      <p className="item-card-category2" style={category2Style}>
        &nbsp;
      </p>
      <p className="item-card-category1" style={category1Style}>
        &nbsp;
      </p>
      <p className="item-card-cost" style={costStyle}>
        &nbsp;
      </p>
      <p className="item-card-stock" style={stockStyle}>
        &nbsp;
      </p>
    </div>
  );
}
