import styles from "./LiveStreamsCTA.module.css";
export default function LiveStreamsCTA() {
  return (
    <section className={styles.wrap}>
      <div className={styles.tile}>
        <div className={styles.icon}>📺</div>
        <div className={styles.title}>Live Streams</div>
      </div>
    </section>
  );
}
