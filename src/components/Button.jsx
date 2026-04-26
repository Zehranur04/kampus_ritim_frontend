import React from "react";
import "./button.css";

export default function Button({ as:Tag="button", variant="primary", className="", children, ...rest }) {
  return (
    <Tag className={`kr-btn ${variant} ${className}`} {...rest}>
      <span className="glow"/>
      {children}
    </Tag>
  );
}
