import { useEffect, useRef, useState } from "react";

const API_URL = "";

function PoliceDashboard({ setPage }) {

  const [stats, setStats] = useState({
    total: 0,

    status_distribution: {
      Submitted: 0,
      "Under Review": 0,
      "In Progress": 0,
      Resolved: 0
    },

    severity_distribution: {
      Critical: 0,
      High: 0,
      Normal: 0
    },

    crime_distribution: [],

    daily_trend: []
  });

  const [complaints, setComplaints] = useState([]);

  const [loading, setLoading] = useState(false);

  const pieCanvasRef = useRef(null);


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {

    setLoading(true);

    await loadStats();

    await loadComplaints();

    setLoading(false);
  };


  // =====================================================
  // LOAD STATISTICS
  // =====================================================

  const loadStats = async () => {

    try {

      const response = await fetch(
        `${API_URL}/api/police/statistics`
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Unable to load statistics"
        );

      }

      setStats(data);

    }

    catch (error) {

      console.error(
        "Statistics error:",
        error
      );

      alert(
        "Unable to load statistics."
      );

    }
  };


  // =====================================================
  // LOAD COMPLAINTS
  // =====================================================

  const loadComplaints = async () => {

    try {

      const response = await fetch(
        `${API_URL}/api/police/complaints`
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Unable to load complaints"
        );

      }

      setComplaints(data);

    }

    catch (error) {

      console.error(
        "Complaints error:",
        error
      );

      alert(
        "Unable to load complaints."
      );

    }
  };


  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const updateStatus = async (
    complaintId,
    status
  ) => {

    if (!status) {
      return;
    }

    try {

      const response = await fetch(

        `${API_URL}/api/police/complaints/` +
        `${complaintId}/status`,

        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            status: status
          })
        }

      );


      const data = await response.json();


      if (!response.ok) {

        alert(
          data.error ||
          "Unable to update status."
        );

        return;
      }


      alert(
        "Complaint status updated successfully."
      );


      await loadDashboard();

    }

    catch (error) {

      console.error(
        "Status update error:",
        error
      );

      alert(
        "Unable to update complaint status."
      );

    }

  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadDashboard();

  }, []);


  // =====================================================
  // SEVERITY PIE CHART
  // =====================================================

  useEffect(() => {

    createSeverityPieChart(
      stats.severity_distribution
    );

  }, [stats.severity_distribution]);


  // =====================================================
  // PIE CHART FUNCTION
  // =====================================================

  const createSeverityPieChart = (data) => {

    const canvas = pieCanvasRef.current;

    if (!canvas) {
      return;
    }


    const entries =
      Object.entries(data || {});


    if (entries.length === 0) {
      return;
    }


    const total =
      entries.reduce(
        (sum, item) =>
          sum + item[1],
        0
      );


    if (total === 0) {
      return;
    }


    const ctx =
      canvas.getContext("2d");


    const centerX = 160;
    const centerY = 160;
    const radius = 110;


    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    let startAngle =
      -Math.PI / 2;


    // Same colors from original JS
    const colors = {

      Critical: "#dc2626",

      High: "#f59e0b",

      Normal: "#16a34a"

    };


    entries.forEach(
      ([label, value]) => {

        const sliceAngle =
          (value / total) *
          (2 * Math.PI);


        const endAngle =
          startAngle +
          sliceAngle;


        ctx.beginPath();


        ctx.moveTo(
          centerX,
          centerY
        );


        ctx.arc(
          centerX,
          centerY,
          radius,
          startAngle,
          endAngle
        );


        ctx.closePath();


        ctx.fillStyle =
          colors[label] ||
          "#64748b";


        ctx.fill();


        ctx.strokeStyle =
          "#ffffff";


        ctx.lineWidth = 2;


        ctx.stroke();


        startAngle =
          endAngle;

      }
    );

  };


  // =====================================================
  // CRIME TYPE DATA
  // =====================================================

  const crimeData =
    [...(stats.crime_distribution || [])]
      .sort(
        (a, b) =>
          b.count - a.count
      );


  const maxCrimeValue =
    crimeData.length > 0
      ? Math.max(
          ...crimeData.map(
            item => item.count
          )
        )
      : 0;


  const crimeColors = [

    "#2563eb",

    "#7c3aed",

    "#db2777",

    "#ea580c",

    "#059669",

    "#0891b2",

    "#ca8a04",

    "#4f46e5",

    "#be123c",

    "#0f766e"

  ];


  // =====================================================
  // DAILY TREND
  // =====================================================

  const trendData =
    stats.daily_trend || [];


  const maxTrendValue =
    trendData.length > 0
      ? Math.max(
          ...trendData.map(
            item => item.count
          )
        )
      : 0;


  return (

    <>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">

        <div className="logo">
          Police Cybercrime Dashboard
        </div>

        <nav>

          <button
            className="dashboard-nav-button"
            onClick={() => setPage("public")}
          >
            Public Portal
          </button>

        </nav>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="container">


        {/* =================================================
            DASHBOARD HEADER
        ================================================= */}

        <div className="dashboard-header">

          <div>

            <h1>
              Police Dashboard
            </h1>

            <p>
              Monitor cybercrime complaints,
              severity and crime categories.
            </p>

          </div>


          <button
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

        </div>


        {/* =================================================
            SUMMARY STATISTICS
        ================================================= */}

        <section className="stats">


          <div className="stat-card">

            <h3>
              Total Complaints
            </h3>

            <p>
              {stats.total || 0}
            </p>

          </div>


          <div className="stat-card">

            <h3>
              Submitted
            </h3>

            <p>
              {
                stats.status_distribution
                  ?.["Submitted"] || 0
              }
            </p>

          </div>


          <div className="stat-card">

            <h3>
              Under Review
            </h3>

            <p>
              {
                stats.status_distribution
                  ?.["Under Review"] || 0
              }
            </p>

          </div>


          <div className="stat-card">

            <h3>
              In Progress
            </h3>

            <p>
              {
                stats.status_distribution
                  ?.["In Progress"] || 0
              }
            </p>

          </div>


          <div className="stat-card">

            <h3>
              Resolved
            </h3>

            <p>
              {
                stats.status_distribution
                  ?.["Resolved"] || 0
              }
            </p>

          </div>


        </section>


        {/* =================================================
            STATISTICAL ANALYSIS
        ================================================= */}

        <section className="card">

          <h2>
            Statistical Analysis
          </h2>

          <p className="description">
            Analysis of submitted complaints based on
            AI-predicted severity and crime type.
          </p>


          <div className="analysis-grid">


            {/* =========================================
                SEVERITY PIE CHART
            ========================================== */}

            <div className="analysis-card">

              <h2>
                Complaints by Severity
              </h2>

              <p className="description">
                Distribution of complaints by
                predicted severity.
              </p>


              <div className="pie-chart">

                <canvas
                  ref={pieCanvasRef}
                  width="320"
                  height="320"
                />


                <div className="pie-legend">

                  {
                    Object.entries(
                      stats.severity_distribution || {}
                    ).map(
                      ([label, value]) => {

                        const total =
                          Object.values(
                            stats.severity_distribution || {}
                          ).reduce(
                            (sum, item) =>
                              sum + item,
                            0
                          );


                        const percentage =
                          total > 0
                            ? (
                                (value / total) *
                                100
                              ).toFixed(1)
                            : 0;


                        const color =
                          {
                            Critical:
                              "#dc2626",

                            High:
                              "#f59e0b",

                            Normal:
                              "#16a34a"

                          }[label] ||
                          "#64748b";


                        return (

                          <div
                            className="pie-legend-item"
                            key={label}
                          >

                            <span
                              className="pie-dot"
                              style={{
                                backgroundColor:
                                  color
                              }}
                            >
                            </span>

                            <span>

                              <strong>
                                {label}
                              </strong>

                              {" - "}

                              {value} complaints

                              {" ("}

                              {percentage}

                              {"%)"}

                            </span>

                          </div>

                        );

                      }
                    )
                  }

                </div>

              </div>

            </div>


            {/* =========================================
                CRIME TYPE BAR GRAPH
            ========================================== */}

            <div className="analysis-card">

              <h2>
                Crime Type Distribution
              </h2>

              <p className="description">
                Number of complaints for each
                AI-predicted crime type.
              </p>


              <div className="crime-bar-chart">

                {
                  crimeData.length === 0 ? (

                    <p>
                      No crime type data available.
                    </p>

                  ) : (

                    crimeData.map(
                      (item, index) => {

                        const percentage =
                          maxCrimeValue > 0
                            ? (
                                (item.count /
                                  maxCrimeValue) *
                                100
                              )
                            : 0;


                        const color =
                          crimeColors[
                            index %
                            crimeColors.length
                          ];


                        return (

                          <div
                            className="crime-bar-row"
                            key={
                              item.crime_type
                            }
                          >

                            <div className="crime-bar-label">
                              {item.crime_type}
                            </div>


                            <div className="crime-bar-container">

                              <div
                                className="crime-bar"
                                style={{
                                  width:
                                    `${percentage}%`,
                                  background:
                                    color
                                }}
                              >
                              </div>

                            </div>


                            <div className="crime-bar-value">
                              {item.count}
                            </div>

                          </div>

                        );

                      }
                    )

                  )
                }

              </div>

            </div>


          </div>

        </section>


        {/* =================================================
            DAILY TREND
        ================================================= */}

        <section className="card">

          <h2>
            Daily Complaint Trend
          </h2>

          <p className="description">
            Number of complaints submitted on each day.
          </p>


          <div className="trend-chart">

            {
              trendData.length === 0 ? (

                <p>
                  No trend data available.
                </p>

              ) : (

                trendData.map(
                  (item) => {

                    const height =
                      maxTrendValue > 0
                        ? (
                            (item.count /
                              maxTrendValue) *
                            100
                          )
                        : 0;


                    return (

                      <div
                        className="trend-column"
                        key={item.date}
                      >

                        <div className="trend-value">
                          {item.count}
                        </div>


                        <div
                          className="trend-bar"
                          style={{
                            height:
                              `${height}%`
                          }}
                        >
                        </div>


                        <div className="trend-label">
                          {item.date}
                        </div>

                      </div>

                    );

                  }
                )

              )
            }

          </div>

        </section>


        {/* =================================================
            SEVERITY SUMMARY
        ================================================= */}

        <section className="card">

          <h2>
            Severity Summary
          </h2>


          <div className="severity-summary">


            <div className="severity-item critical">

              <span>
                Critical
              </span>

              <strong>
                {
                  stats.severity_distribution
                    ?.["Critical"] || 0
                }
              </strong>

            </div>


            <div className="severity-item high">

              <span>
                High
              </span>

              <strong>
                {
                  stats.severity_distribution
                    ?.["High"] || 0
                }
              </strong>

            </div>


            <div className="severity-item normal">

              <span>
                Normal
              </span>

              <strong>
                {
                  stats.severity_distribution
                    ?.["Normal"] || 0
                }
              </strong>

            </div>


          </div>

        </section>


        {/* =================================================
            COMPLAINT TABLE
        ================================================= */}

        <section className="card">


          <div className="section-header">

            <div>

              <h2>
                Recent Complaints
              </h2>

              <p className="description">
                Review complaints and update
                their current status.
              </p>

            </div>


            <button
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

          </div>


          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    Complaint
                  </th>

                  <th>
                    Crime Type
                  </th>

                  <th>
                    Severity
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  complaints.length === 0 ? (

                    <tr>

                      <td
                        colSpan="7"
                        style={{
                          textAlign: "center"
                        }}
                      >
                        No complaints available.
                      </td>

                    </tr>

                  ) : (

                    complaints.map(
                      (complaint) => (

                        <tr
                          key={
                            complaint.complaint_id
                          }
                        >

                          <td>
                            {complaint.complaint_id}
                          </td>


                          <td className="complaint-text">
                            {complaint.complaint}
                          </td>


                          <td>
                            {complaint.crime_type}
                          </td>


                          <td>

                            <span className="severity-badge">
                              {complaint.severity}
                            </span>

                          </td>


                          <td>

                            <span className="status-badge">
                              {complaint.status}
                            </span>

                          </td>


                          <td>
                            {complaint.created_at}
                          </td>


                          <td>

                            <select
                              value=""
                              onChange={(e) =>
                                updateStatus(
                                  complaint.complaint_id,
                                  e.target.value
                                )
                              }
                            >

                              <option value="">
                                Change
                              </option>

                              <option value="Submitted">
                                Submitted
                              </option>

                              <option value="Under Review">
                                Under Review
                              </option>

                              <option value="In Progress">
                                In Progress
                              </option>

                              <option value="Resolved">
                                Resolved
                              </option>

                            </select>

                          </td>

                        </tr>

                      )
                    )

                  )
                }

              </tbody>

            </table>

          </div>

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

export default PoliceDashboard;
