import React from "react";
import { Play, FileText, ClipboardList } from "lucide-react";
import "./StudyTabs.css";

const StudyTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "videos", label: "Free Videos", icon: Play },
    { id: "notes", label: "Study Notes", icon: FileText },
    { id: "tests", label: "Mock Tests", icon: ClipboardList },
  ];

  return (
    <div className="study-tabs-container">
      <div className="tabs-wrapper">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudyTabs;