import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../utils/api";

function Leaderboard() {
  const { testId } = useParams();
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const res = await API.get(`/results/leaderboard/${testId}`);
    setLeaders(res.data);
  };

  return (
    <div className="container mt-5">
      <h2>Leaderboard</h2>

      <table className="table table-bordered mt-4">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((user, index) => (
            <tr key={user._id}>
              <td>{index + 1}</td>
              <td>{user.student.name}</td>
              <td>{user.percentage.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;