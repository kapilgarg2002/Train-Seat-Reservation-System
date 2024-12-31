import React, { useState, useEffect } from "react";
import axios from "axios";

function Reserve() {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatCount, setSeatCount] = useState(0);
  const [user, setUser] = useState("loading...");

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:3001/current-user", {
        headers: { Authorization: localStorage.getItem("token") },
      });
      console.log(response);
      setUser(response.data.name);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchSeats();
  }, []);
  const cancelBooking = async () => {
    try {
      await axios.post(
        "http://localhost:3001/cancel",
        { seatCount: selectedSeats.length },
        { headers: { Authorization: localStorage.getItem("token") } }
      );
      setSelectedSeats([]);
      fetchSeats();
    } catch (error) {
      alert(error.response.data.error);
      console.error("Error canceling booking:", error);
    }
  };
  const fetchSeats = async () => {
    try {
      const response = await axios.get("http://localhost:3001/seats", {
        headers: { Authorization: localStorage.getItem("token") },
      });
      setSeats(response.data.availableSeats);
    } catch (error) {
      console.error("Error fetching seats:", error);
    }
  };

  const handleSelectSeat = (seat) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else if (selectedSeats.length < seatCount) {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleReserve = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3001/reserve",
        { seatCount: seatCount },
        { headers: { Authorization: localStorage.getItem("token") } }
      );
      alert(`Reserved seats: ${response.data.reservedSeats.join(", ")}`);
      fetchSeats();
      setSelectedSeats([]);
    } catch (error) {
      alert(error.response.data.error);
      console.error("Error reserving seats:", error);
    }
  };

  return (
    <div>
      {localStorage.getItem("token") && (
        <button
          style={{ marginLeft: "10px" }}
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      )}
      <h1>Reserve Seats for User: {user} </h1>

      <label>
        Number of seats to reserve:
        <input
          type="number"
          value={seatCount}
          onChange={(e) => setSeatCount(parseInt(e.target.value))}
          min="1"
          max="7"
        />
      </label>
      <div className="seats-grid">
        {Array.from({ length: 80 }, (_, i) => i + 1).map((seat, index) => (
          <React.Fragment key={seat}>
            <button
              className={`seat ${
                selectedSeats.includes(seat)
                  ? "selected"
                  : seats.includes(seat)
                  ? "available"
                  : "reserved"
              }`}
              onClick={() => handleSelectSeat(seat)}
              disabled={!seats.includes(seat)}
            >
              {seat}
            </button>
            {(index + 1) % 7 === 0 && <br />}
          </React.Fragment>
        ))}
      </div>
      <button onClick={handleReserve}>Reserve Seats</button>
      <button onClick={cancelBooking}>Cancel Bookings</button>
    </div>
  );
}

export default Reserve;
