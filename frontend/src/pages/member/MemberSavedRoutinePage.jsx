import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRoutinePlan } from '../../services/api';
import styles from './WorkoutGenerator.module.css';

const MemberSavedRoutinePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState(null);

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const res = await getMyRoutinePlan();
        if (res && res.hasRoutine) {
          setRoutine(res);
        }
      } catch (err) {
        console.error('Failed to load routine plan', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutine();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ color: '#888', textAlign: 'center', marginTop: '50px', fontSize: '13px', fontWeight: '600' }}>
          Loading your routine plan...
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2 style={{ color: '#fff', fontFamily: "'Archive', sans-serif" }}>No Routine Found</h2>
          <p style={{ color: '#888', marginTop: '10px' }}>You haven't generated or saved a routine yet.</p>
          <button 
            onClick={() => navigate('/member/workout-generator')} 
            className={styles.generateBtn}
            style={{ marginTop: '30px' }}
          >
            Generate a Routine
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.routineCard}>
          <h2 className={styles.routineTitle}>{routine.title}</h2>
          <p className={styles.routineDesc}>{routine.description}</p>
          
          {routine.days && routine.days.map((day, idx) => (
            <div key={idx} className={styles.dayCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 className={styles.dayTitle} style={{ margin: 0 }}>{day.dayLabel} <span style={{ fontSize: '12px', color: '#888', marginLeft: '10px' }}>{day.date}</span></h3>
                {day.isCompleted && (
                  <span style={{ background: '#4caf50', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>COMPLETED</span>
                )}
              </div>
              <ul className={styles.exerciseList}>
                {day.isRestDay ? (
                  <li className={styles.exerciseItem}>
                    <span className={styles.exerciseName} style={{ color: '#888' }}>Rest & Recovery</span>
                  </li>
                ) : (
                  day.exercises && day.exercises.map((ex, exIdx) => (
                    <li key={exIdx} className={styles.exerciseItem}>
                      <span className={styles.exerciseName}>{ex.exerciseName}</span>
                      <span className={styles.exerciseSets}>{ex.sets} sets x {ex.reps}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
          
          <div className={styles.actionButtons}>
            <button 
              onClick={() => navigate('/member/dashboard')} 
              className={styles.secondaryBtn}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberSavedRoutinePage;
