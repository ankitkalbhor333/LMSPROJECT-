 import "./studentresult.css"
const StudentResults = () => {
  return (
    <section className="section light-bg">
      <h2>Real Students, Real Selection Results</h2>

      <div className="card-grid">
        <div className="card">
          <p>"Very good teaching experience."</p>
          <h4>Het Chhaniyara</h4>
        </div>

        <div className="card">
          <p>"Best application for exam preparation."</p>
          <h4>Asad Alam</h4>
        </div>

        <div className="card">
          <p>"Math improvement was amazing."</p>
          <h4>Darshita Tripathi</h4>
        </div>
      </div>
    </section>
  );
};

export default StudentResults;