import React, { useRef } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";

const App = () => {
  const dashboardRef = useRef(null);

  const handleDashboardClick = () => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-custom-orange min-h-screen">
      <Navbar onDashboardClick={handleDashboardClick} />
      <div className="pt-20"> {/* Adjust padding for fixed navbar */}
        <section ref={dashboardRef}>
          <Dashboard />
        </section>
      </div>
    </div>
  );
};

export default App;
