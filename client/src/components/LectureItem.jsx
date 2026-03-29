function LectureItem({ lecture }) {

  return (
    <div
      style={{
        padding: 6,
        marginTop: 5,
        borderBottom: "1px solid #eee"
      }}
    >
      📺 {lecture.title}

      <span style={{ float: "right" }}>
        ✏️ 🗑
      </span>

    </div>
  );
}

export default LectureItem;