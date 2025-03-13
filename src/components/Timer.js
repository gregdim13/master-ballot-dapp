import React, { Component } from "react";
import { Hourglass } from "react-loader-spinner";   // Component για την εμφάνιση του εικονιδίου hourglass
import { BsHourglassBottom } from "react-icons/bs"; // Εικονίδιο hourglass από react-icons για την εμφάνιση όταν τελειώσει ο χρόνος

class Timer extends Component {
    constructor(props) {
        super(props);
        // Υπολογισμός του υπολειπόμενου χρόνου από τα props
        const remainingTime = Math.max(0, parseInt(this.props.endTime, 10) - parseInt(this.props.curTimestamp, 10));

        this.state = {
            time: this.secondsToTime(remainingTime),    // Το αντικείμενο με τα χαρακτηριστικά ώρες, λεπτά, δευτερόλεπτα του υπολειπόμενου χρόνου
            seconds: remainingTime,                     // Ο υπολειπόμενος χρόνος σε δευτερόλεπτα
        };
        this.timer = null;
    }

    componentDidMount() {
        // Έναρξη της αντίστροφης μέτρησης μόλις το component φορτωθεί
        if (this.state.seconds > 0) {
            this.startTimer();
        }
    }

    componentWillUnmount() {
        // Διακοπή της αντίστροφης μέτρησης όταν το component θα απομακρυνθεί
        this.stopTimer();
    }

    startTimer = () => {
        // Έναρξη αντίστροφης μέτρησης μόνο αν δεν έχει ήδη ξεκινήσει
        if (!this.timer && this.state.seconds > 0) {
            this.timer = setInterval(this.countDown, 1000);
        }
    };

    stopTimer = () => {
        // Διακοπή του timer
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    };

    countDown = () => {
        // Αντίστροφη μέτρηση κάθε δευτερόλεπτο
        this.setState((prevState) => {
            let seconds = prevState.seconds - 1;

            // Διακοπή όταν φτάσουμε στο μηδέν
            if (seconds <= 0) {
                this.stopTimer();
                return { seconds: 0, time: this.secondsToTime(0) };
            }

            return { seconds, time: this.secondsToTime(seconds) };
        });
    };

    secondsToTime(secs) {
        // Μετατροπή των δευτερολέπτων σε ώρες, λεπτά και δευτερόλεπτα
        let hours = Math.floor(secs / 3600);
        let minutes = Math.floor((secs % 3600) / 60);
        let seconds = secs % 60;
        return { h: hours, m: minutes, s: seconds };
    }

    render() {
        return (
            <span className="ms-1" style={{ fontSize: "18px", fontWeight: "bold", verticalAlign: "center", color: "white"}}>
                {/* Εμφάνιση του hourglass και του υπολοιπόμενου χρόνου σε μορφή h:m:s */}
                <Hourglass
                    visible={this.state.seconds > 0}
                    height="28"
                    width="28"
                    ariaLabel="hourglass-loading"
                    wrapperStyle={{}}
                    wrapperClass="hourglass-wrapper"
                    colors={['#306cce', '#72a1ed']} 
                />
                {this.state.seconds <= 0 ? <BsHourglassBottom size={30} color={"#306cce"}/> : <></>}
                &nbsp;
                Time: {String(this.state.time.h).padStart(2, "0")}: 
                      {String(this.state.time.m).padStart(2, "0")}:
                      {String(this.state.time.s).padStart(2, "0")}
            </span>
        );
    }
}

export default Timer;
