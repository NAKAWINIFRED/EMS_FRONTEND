import React, { useEffect, useState } from "react";
import styles from "./ExamPage.module.css";


const mockExams = [
  { id: 1, name: "Math Exam", startTime: new Date(Date.now() + 5 * 60 * 1000) },
  { id: 2, name: "Science Exam", startTime: new Date(Date.now() + 15 * 60 * 1000) },
  { id: 3, name: "History Exam", startTime: new Date(Date.now() - 2 * 60 * 1000) },
];

export default function ExamsPage() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    setExams(mockExams);
  }, []);

  const isAccessible = (startTime) => {
    const now = new Date();
    const diff = (startTime - now) / 1000 / 60;
    return diff <= 10 && diff >= -60; // accessible from 10 minutes before to 1 hour after start
  };

  return (
    <div className={styles.container}>
  <h2 className={styles.title}>Your Exams</h2>
  <table className={styles.table}>
    <thead>
      <tr>
        <th>Exam Name</th>
        <th>Start Time</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {exams.map((exam) => (
        <tr key={exam.id}>
          <td>{exam.name}</td>
          <td>{exam.startTime.toLocaleTimeString()}</td>
          <td>
            {isAccessible(exam.startTime) ? (
              <button className={styles.button}>Start Exam</button>
            ) : (
              <span className={styles.notAvailable}>Not yet available</span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

  );
}