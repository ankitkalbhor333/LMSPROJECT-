import { useState } from "react";
import UnitItem from "./UnitItem";

function SubjectItem({ subject }) {

  const [open, setOpen] = useState(true);

  return (
    <div style={{ border: "1px solid #ddd", marginTop: 10 }}>

      <div
        style={{ padding: 10, cursor: "pointer" }}
        onClick={() => setOpen(!open)}
      >
        {open ? "▼" : "▶"} {subject.title}
      </div>

      {open && (
        <div style={{ marginLeft: 20 }}>

          <button>+ Add Unit</button>

          {subject.units.map((unit) => (
            <UnitItem key={unit._id} unit={unit} />
          ))}

        </div>
      )}

    </div>
  );
}

export default SubjectItem;