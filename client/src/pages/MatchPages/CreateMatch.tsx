import { useNavigate } from "react-router-dom";
import styles from "./CreateMatch.module.css";
import MatchForm from "../../components/MatchPageComp/MatchForm";

const CreateMatch = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>FILL IN MATCH FORM OR</h2>
      <button className={styles.uploadCsv}>UPLOAD AS A CSV</button>

      <MatchForm onCancel={() => navigate("/my-matches")} />
    </div>
  );
};

export default CreateMatch;
