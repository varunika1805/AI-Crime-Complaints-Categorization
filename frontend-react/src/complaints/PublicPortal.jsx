import { useState } from "react";

const API_URL = "";

function PublicPortal({ setPage }) {

  const [complaint, setComplaint] = useState("");
  const [complaintId, setComplaintId] = useState("");
  const [trackId, setTrackId] = useState("");

  const [trackResult, setTrackResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);

  // =====================================================
  // SUBMIT COMPLAINT
  // =====================================================

  const submitComplaint = async () => {

    const complaintText = complaint.trim();

    if (!complaintText) {
      alert("Please enter your complaint.");
      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/complaints`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            complaint: complaintText
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error);
        return;
      }

      // Show complaint ID
      setComplaintId(data.complaint_id);

      // Put ID automatically into tracking box
      setTrackId(data.complaint_id);

      // Clear complaint
      setComplaint("");

      alert(
        "Complaint submitted successfully.\n\n" +
        "Complaint ID: " +
        data.complaint_id
      );

    }

    catch (error) {

      console.error(error);

      alert("Unable to connect to the server.");

    }

    finally {
      setLoading(false);
    }
  };


  // =====================================================
  // TRACK COMPLAINT
  // =====================================================

  const trackComplaint = async () => {

    const complaintIdValue = trackId.trim();

    if (!complaintIdValue) {

      alert("Please enter your Complaint ID.");

      return;
    }

    try {

      setTracking(true);

      const response = await fetch(
        `${API_URL}/api/complaints/${complaintIdValue}`
      );

      const data = await response.json();

      if (!response.ok) {

        alert(data.error);

        return;
      }

      setTrackResult(data);

    }

    catch (error) {

      console.error(error);

      alert("Unable to connect to the server.");

    }

    finally {
      setTracking(false);
    }
  };


  return (

    <>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="topbar">

        <div className="brand">
          🛡️ AI Cybercrime Complaint Portal
        </div>

        <nav className="nav-links">

          <button
            className="nav-button"
            onClick={() => setPage("public")}
          >
            Public Portal
          </button>

          <button
            className="nav-button"
            onClick={() => setPage("police")}
          >
            Police Dashboard
          </button>

        </nav>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero">

        <div className="hero-content">

          <h1>
            Report Cybercrime
            <br />
            Safely and Easily
          </h1>

         

        </div>

      </section>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-container">


        {/* =================================================
            SUBMIT COMPLAINT
        ================================================= */}

        <section className="card">

          <h2>
            Submit a Complaint
          </h2>

          <p className="description">
            Describe the incident clearly.
            Include relevant details such as what
            happened, how it happened and when it happened.
          </p>


          <label htmlFor="complaint">
            Complaint Description
          </label>


          <textarea
            id="complaint"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Example: I received a message asking me to click a link and provide my bank details. After entering the details, money was withdrawn from my account."
          />


          <button
            className="primary-button"
            onClick={submitComplaint}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>

        </section>


        {/* =================================================
            SUCCESS CARD
        ================================================= */}

        {complaintId && (

          <section className="card success-card">

            <h2>
              Complaint Submitted Successfully
            </h2>

            <p className="description">
              Your complaint has been registered successfully.
              Please save the Complaint ID below.
            </p>


            <div className="complaint-id-box">

              <span>
                Your Complaint ID
              </span>

              <strong>
                {complaintId}
              </strong>

            </div>

          </section>

        )}


        {/* =================================================
            TRACK COMPLAINT
        ================================================= */}

        <section className="card">

          <h2>
            Track Your Complaint
          </h2>

          <p className="description">
            Enter your Complaint ID to check
            the current status of your complaint.
          </p>


          <label htmlFor="trackId">
            Complaint ID
          </label>


          <input
            type="text"
            id="trackId"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="Example: CMP-1234ABCD"
          />


          <button
            className="primary-button"
            onClick={trackComplaint}
            disabled={tracking}
          >
            {tracking ? "Tracking..." : "Track Complaint"}
          </button>


          {/* TRACKING RESULT */}

          {trackResult && (

            <div className="status-box">

              <h3>
                Complaint Information
              </h3>


              <div className="tracking-row">

                <span>
                  Complaint ID
                </span>

                <strong>
                  {trackResult.complaint_id}
                </strong>

              </div>


              <div className="tracking-row">

                <span>
                  Current Status
                </span>

                <strong>
                  {trackResult.status}
                </strong>

              </div>


              <div className="tracking-row">

                <span>
                  Submitted On
                </span>

                <strong>
                  {trackResult.created_at}
                </strong>

              </div>


              <div className="tracking-row">

                <span>
                  Last Updated
                </span>

                <strong>
                  {trackResult.updated_at}
                </strong>

              </div>

            </div>

          )}

        </section>


      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>

        <p>
          AI-Based Cybercrime Complaint Categorization
        </p>

      </footer>

    </>

  );
}

export default PublicPortal;
