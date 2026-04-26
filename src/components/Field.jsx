import React from "react";
import "./field.css";

export default function Field({ label, error, right, ...props }) {
  return (
    <div className={`kr-field ${error ? "err":""}`}>
      <label>{label}</label>
      <div className="input-wrap">
        <input {...props} />
        {right}
      </div>
      {error && <div className="msg">{error}</div>}
      <span className="ring"/>
    </div>
  );
}
