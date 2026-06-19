import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoutine, saveRoutine } from '../../services/api';
import styles from './WorkoutGenerator.module.css';

const WorkoutGeneratorPage = () => {
  const navigate = useNavigate();

  // Step 1: Parameters | Step 2: Results
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Routine Data
  const [routine, setRoutine] = useState(null);

  // Form State
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [targetSplit, setTargetSplit] = useState('');
  const [experienceLevel, setExperienceLevel] = useState(3); // 1 to 5

  const goals = ['Build Muscle', 'Lose Fat', 'Increase Strength', 'General Fitness'];
  const splits = ['Full Body (3x/week)', 'Upper/Lower (4x/week)', 'Push/Pull/Legs (6x/week)', 'Bro Split (5x/week)'];
  const experienceLabels = {
    1: 'Beginner',
    2: 'Novice',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert'
  };

  const handleGenerate = async () => {
    if (!fitnessGoal || !targetSplit) {
      setError("Please select a fitness goal and target split.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const data = {
        fitnessGoal,
        targetSplit,
        experienceLevel: experienceLabels[experienceLevel]
      };
      
      const response = await generateRoutine(data);
      // Backend returns { routineId, title, description, days: [{ dayName, exercises: [{ name, sets, reps, notes }] }] }
      setRoutine(response);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate workout. KG Coach might be resting!");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!routine) return;
    setSaving(true);
    try {
      const payload = {
        goal: fitnessGoal,
        fitnessLevel: experienceLabels[experienceLevel],
        days: routine.days.map(day => ({
          dayLabel: day.dayLabel || 'Day',
          focusArea: day.focusArea || 'General',
          isRestDay: !!day.isRestDay,
          exercises: (day.exercises || []).map(ex => ({
            exerciseName: ex.exerciseName || '',
            sets: ex.sets || '3',
            reps: ex.reps || '10',
            startingWeight: ex.startingWeight || 'Bodyweight'
          }))
        }))
      };
      await saveRoutine(payload);
      alert("Routine saved successfully to your profile!");
      navigate('/member/dashboard');
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save routine.");
    } finally {
      setSaving(false);
    }
  };

  if (step === 2 && routine) {
    return (
      <div className={styles.container}>
        <div className={styles.section}>
          <div className={styles.routineCard}>
            <h2 className={styles.routineTitle}>{routine.title}</h2>
            <p className={styles.routineDesc}>{routine.description}</p>
            
            {routine.days && routine.days.map((day, idx) => (
              <div key={idx} className={styles.dayCard}>
                <h3 className={styles.dayTitle}>{day.dayLabel}</h3>
                <ul className={styles.exerciseList}>
                  {day.exercises.map((ex, exIdx) => (
                    <li key={exIdx} className={styles.exerciseItem}>
                      <span className={styles.exerciseName}>{ex.exerciseName}</span>
                      <span className={styles.exerciseSets}>{ex.sets} sets x {ex.reps}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            <div className={styles.actionButtons}>
              <button 
                onClick={() => { setStep(1); setRoutine(null); }} 
                className={styles.secondaryBtn}
                disabled={saving}
              >
                Discard & Redo
              </button>
              <button 
                onClick={handleSave} 
                className={styles.generateBtn}
                style={{ margin: 0, padding: '12px 30px', fontSize: '16px' }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Routine'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.headerTitle}>Workout Generator</h1>
      <p className={styles.subtitle}>Let KG Coach build your perfect routine</p>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>1. What is your fitness goal?</h3>
        <div className={styles.grid}>
          {goals.map(goal => (
            <button
              key={goal}
              className={`${styles.optionBtn} ${fitnessGoal === goal ? styles.active : ''}`}
              onClick={() => setFitnessGoal(goal)}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>2. Choose your split</h3>
        <div className={styles.grid}>
          {splits.map(split => (
            <button
              key={split}
              className={`${styles.optionBtn} ${targetSplit === split ? styles.active : ''}`}
              onClick={() => setTargetSplit(split)}
            >
              {split}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>3. Experience Level</h3>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span style={{ color: experienceLevel === 1 ? '#f7f014' : '#a0a0a0' }}>Beginner</span>
            <span style={{ color: experienceLevel === 3 ? '#f7f014' : '#a0a0a0' }}>Intermediate</span>
            <span style={{ color: experienceLevel === 5 ? '#f7f014' : '#a0a0a0' }}>Expert</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(parseInt(e.target.value))}
            className={styles.sliderInput}
          />
          <p style={{ textAlign: 'center', color: '#f7f014', fontWeight: 'bold' }}>
            {experienceLabels[experienceLevel]}
          </p>
        </div>
      </div>

      <button 
        className={styles.generateBtn} 
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'GENERATING...' : 'GENERATE WORKOUT'}
      </button>
    </div>
  );
};

export default WorkoutGeneratorPage;
