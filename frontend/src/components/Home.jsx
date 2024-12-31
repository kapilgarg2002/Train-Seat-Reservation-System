import React from "react";
import { Link } from "react-router-dom";
function Home() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/login">Login</Link> |{" "}
        <Link to="/signup">Signup</Link> |{" "}
        {/* <Link to="/reserve">Reserve Seats</Link> */}
      </nav>
      <h1>Welcome to the Train Seat Reservation System</h1>
      <p>Use the navigation links to Login or Signup.</p>
    </div>
  );
}

export default Home;
