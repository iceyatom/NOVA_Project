"use client";

export default function APIError({
  title,
  message,
  apiStatus,
}: {
  title: string;
  message: string;
  apiStatus: string;
}) {
  // Function
  const handleClick = (
    event:
      | React.KeyboardEvent<HTMLDivElement>
      | React.MouseEvent<HTMLDivElement>,
  ) => {
    if (event.type === "keydown" && "key" in event && event.key !== "Enter")
      return;
    if (event.type === "click") event.preventDefault();

    event.preventDefault();
    window.location.reload();
  };

  // Styles
  const style = {
    marginLeft: "1rem",
    marginRight: "1rem",
    marginBottom: "1rem",
    borderRadius: "0.25rem",
    border: "1px solid #fca5a5", // light red border
    backgroundColor: "#fef2f2", // soft red background
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    color: "#b91c1c", // red text
  };

  // HTML
  return (
    <div
      role="alert"
      style={style}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
    >
      {title} {message} {apiStatus}{" "}
      <a href="#" role="link" tabIndex={0}>
        Try again?
      </a>
    </div>
  );
}
