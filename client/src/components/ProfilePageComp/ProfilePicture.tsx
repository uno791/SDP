import React, { useState } from "react";
import styles from "./ProfilePicture.module.css";

interface ProfilePictureProps {
  selected: string;
  onChange: (img: string) => void;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  selected,
  onChange,
}) => {
  const [editing, setEditing] = useState(false);

  const handleEditClick = () => {
    setEditing(!editing);
  };

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        <img src={selected} alt="Profile" className={styles.image} />
        <button className={styles.editButton} onClick={handleEditClick}>
          Edit
        </button>
      </div>

      {editing && (
        <div className={styles.selector}>
          <img
            src="/assets/messi.png"
            alt="Messi"
            className={`${styles.option} ${
              selected === "/assets/messi.png" ? styles.active : ""
            }`}
            onClick={() => {
              onChange("/assets/messi.png");
              setEditing(false);
            }}
          />
          <img
            src="/assets/ronaldo.png"
            alt="Ronaldo"
            className={`${styles.option} ${
              selected === "/assets/ronaldo.png" ? styles.active : ""
            }`}
            onClick={() => {
              onChange("/assets/ronaldo.png");
              setEditing(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePicture;
