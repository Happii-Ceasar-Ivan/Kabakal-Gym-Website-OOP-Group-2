import React, { useState } from 'react';
import styles from './WorkoutGenerator.module.css';

const WorkoutGeneratorPage = () => {
    const [selectedGoal, setSelectedGoal] = useState('');
    const [selectedSplit, setSelectedSplit] = useState('');
    const [activeDot, setActiveDot] = useState(1); // 0 to 4 for beginner to pro

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.pageTitle}>WORKOUT GENERATOR</h1>

            <div className={styles.sectionTitle}>A. SELECT FITNESS GOALS</div>
            <div className={styles.fitnessGoalsGrid}>
                {['Hypertrophy', 'Strength', 'Endurance', 'Weight Loss'].map(goal => (
                    <button 
                        key={goal}
                        type="button" 
                        className={selectedGoal === goal ? styles.active : ''}
                        onClick={() => setSelectedGoal(goal)}
                    >
                        {goal}
                    </button>
                ))}
            </div>

            <div className={styles.sectionTitle}>B. TARGET SPLIT ROUTINE</div>
            <div className={styles.targetSplitGrid}>
                {['Push Pull Legs', 'Upper Lower', 'Full Body', 'Bro Split'].map(split => (
                    <button 
                        key={split}
                        type="button" 
                        className={selectedSplit === split ? styles.active : ''}
                        onClick={() => setSelectedSplit(split)}
                    >
                        {split}
                    </button>
                ))}
            </div>

            <div className={styles.sectionTitle}>C. TRAINING DETAILS</div>
            <div className={styles.sessionCard}>
                
                <label htmlFor="session-time">AVAILABLE SESSION TIME</label>
                <div className={styles.dropdownWrapper}>
                    <select id="session-time" defaultValue="60">
                        <option value="30">30 Minutes</option>
                        <option value="45">45 Minutes</option>
                        <option value="60">60 Minutes</option>
                        <option value="90">90 Minutes</option>
                    </select>
                </div>

                <label className={styles.experienceLabel}>EXPERIENCE LEVEL</label>
                
                <div className={styles.levelSelector}>
                    <span className={styles.levelText}>BEGINNER</span>

                    <div className={styles.levelDots}>
                        {[0, 1, 2, 3, 4].map((index) => (
                            <button 
                                key={index}
                                className={`${styles.levelDot} ${activeDot === index ? styles.active : ''}`}
                                onClick={() => setActiveDot(index)}
                            ></button>
                        ))}
                    </div>
                    <span className={styles.levelText}>PRO</span>
                </div>
            </div>
            
            <button className={styles.generateBtn}>GENERATE</button>
        </div>
    );
};

export default WorkoutGeneratorPage;
