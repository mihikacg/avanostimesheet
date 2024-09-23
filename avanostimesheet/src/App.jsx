import React, { useRef } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import ClockInOut from "./components/ClockInOut";

const App = () => {
  const dashboardRef = useRef(null);
  const clockInOutRef = useRef(null);

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-custom-orange min-h-screen">
     <Navbar 
        onDashboardClick={() => scrollToSection(dashboardRef)}
        onClockInOutClick={() => scrollToSection(clockInOutRef)}
      />
      <div className="pt-10"> {/* Adjust padding for fixed navbar */}
        <section ref={dashboardRef}>
          <Dashboard />
        </section>
        <section ref={clockInOutRef}>
          <ClockInOut/>
        </section>
      </div>
    </div>
  );
};

export default App;
