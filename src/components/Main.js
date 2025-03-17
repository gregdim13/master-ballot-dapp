import React, { Component } from 'react';
import './Main.css';
import chairperson from "../assets/chairperson.svg";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

class Main extends Component {

    constructor(props) {
        super(props);
        // Αρχικοποίηση των states
        this.state = {
            candidateIndex: 0,                  // index υποψηφίου 
            inputType: 'password',              // ορίζει το type του input tag στo πεδίο εισαγωγής κωδικού
            showPasswordIcon: <FaEyeSlash />    // το εικονίδιο ματάκι στο input του password
        };
    }

    // Η togglePasswordVisibility αλλάζει τον τύπο του input μεταξύ κειμένου και password, επιτρέποντας έτσι την εμφάνιση ή απόκρυψη του κωδικού
    togglePasswordVisibility = () => {
        this.setState(prevState => ({
            inputType: prevState.inputType === 'password' ? 'text' : 'password',                    // Ελέγχει τον τρέχοντα τύπο του input. Αν είναι 'password', τον αλλάζει σε 'text', δηλαδή κάνει τον κωδικό ορατό.
            showPasswordIcon: prevState.inputType === 'password' ? <FaEye /> : <FaEyeSlash />       // Εναλλάσσει το εικονίδιο ανάλογα με τον τύπο του input.
        }));
    };


    // Αλλάζει το index του επιλεγμένου υποψηφίου στο state όταν ο χρήστης επιλέξει διαφορετικό υποψήφιο από το dropdown menu
    handleSelectChange = (event) => {
        this.setState({ candidateIndex: event.target.value });
    }

    render() {
        return (
            <div id='content' className='mt-5 mx-5'>
                {/* Πίνακας για την εμφάνιση του αριθμού των εγγεγραμμένων υποψηφίων και ψηφοφόρων */}
                <table className='table table-bordered table-sm text-muted text-center mx-auto transparent-table' style={{ tableLayout: 'fixed' }}>
                    <thead>
                        <tr className='text-white'>
                            <th scope='col'>Registered Candidates</th>
                            <th scope='col'>Registered Voters</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className='text-white'>
                            <td>{this.props.candidateNum}</td>
                            <td>{this.props.voters}</td>
                        </tr>
                    </tbody>
                </table>

                <div className='block mb-2'>
                    {/* Εμφάνιση φορμών εισαγωγής μόνο αν ο χρήστης έχει κανει toggle ON το SWITCH 'chairperson' */}
                    {this.props.chairperson ?
                        <div className='block mb-2'>
                            {/* Φόρμα για την εγγραφή υποψηφίων */}
                            <div className='card mb-2 mt-2' id='candidateNameInput'>
                                <form onSubmit={(event) => {
                                    event.preventDefault();
                                    let candidateName = this.candidateInput.value.toString();   // Παίρνει το όνομα του υποψηφίου από το πεδίο
                                    this.props.registerCandidates(candidateName);               // Κλήση της συνάρτησης registerCandidates από App.js για εγγραφή υποψηφίου
                                }}
                                    className='mx-2 mb-2 mt-2'
                                >
                                    <div style={{ borderSpace: '0 1em' }}>
                                        <label className='float-left mt-2' style={{ marginLeft: '10px' }}><b>Candidate Name: </b></label>
                                        <img src={chairperson} alt="ChairPerson" width="30" className="chairperson-icon" />
                                        <div className='mb-3'>
                                            <input
                                                ref={(input) => { this.candidateInput = input }}
                                                type='text'
                                                placeholder='Enter Candidate Name'
                                                required
                                                style={{ width: '35%' }}
                                            />
                                            {/* Μήνυμα λάθους ή επιτυχίας κατά την εγγραφή υποψηφίου */}
                                            <label id='1' className='float-left'
                                                style={{
                                                    marginLeft: '15px',
                                                    color: this.props.errorTrig ? 'red' : 'green'
                                                }}
                                            >
                                                {this.props.labelId === 1 ? this.props.txMsg : ''}
                                            </label>
                                        </div>
                                        <button type='submit' className='btn btn-primary btn-lg btn-block mb-2'>REGISTER CANDIDATE</button>
                                    </div>
                                </form>
                            </div>

                            {/* Φόρμα για την εγγραφή ψηφοφόρων */}
                            <div className='card mb-2' id='voterAddressInput'>
                                <form onSubmit={(event) => {
                                    event.preventDefault();
                                    let voterAddress = this.voterInput.value.toString();    // Παίρνει τη διεύθυνση του ψηφοφόρου από το πεδίο
                                    this.props.registerVoters(voterAddress);                // Κλήση της συνάρτησης registerVoters από App.js για εγγραφή ψηφοφόρου                                      
                                    this.voterInput.value = "";                             // Καθαρισμός του πεδίου εισαγωγής μετά την υποβολή
                                }}
                                    className='mx-2 mb-2 mt-2'
                                >
                                    <div style={{ borderSpace: '0 1em' }}>
                                        <label className='float-left mt-2' style={{ marginLeft: '10px' }}><b>Voter Address: </b></label>
                                        <img src={chairperson} alt="ChairPerson" width="30" className="chairperson-icon" />
                                        <div className='mb-3'>
                                            <input
                                                ref={(input) => { this.voterInput = input }}
                                                type='text'
                                                placeholder="Enter Voter's Address"
                                                required
                                                style={{ width: '35%' }}
                                            />
                                            {/* Μήνυμα λάθους ή επιτυχίας κατά την εγγραφή ψηφοφόρου */}
                                            <label id='2' className='float-left'
                                                style={{
                                                    marginLeft: '15px',
                                                    color: this.props.errorTrig ? 'red' : 'green'
                                                }}
                                            >
                                                {this.props.labelId === 2 ? this.props.txMsg : ''}
                                            </label>
                                        </div>
                                        <button type='submit' className='btn btn-primary btn-lg btn-block mb-2'>REGISTER VOTER</button>
                                    </div>
                                </form>
                            </div>

                            {/* Φόρμα για την έκδοση των τελικών αποτελεσμάτων της ψηφοφορίας */}
                            <div className='card mb-2' id='issueVotingResults'>
                                <form 
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        this.props.countVotes(); // Κλήση της συνάρτησης countVotes από App.js  για την καταμέτρηση των ψήφων
                                    }}
                                    className='mx-2 mb-2 mt-2' 
                                >
                                    <div style={{borderSpace: '0 1em'}}>
                                        <label className='float-left mt-2 mb-2' style={{marginLeft: '10px'}}>
                                            <b>Press the button to issue final voting results</b>
                                        </label> <br/>
                                        <img src={chairperson} alt="ChairPerson" width="30" className="chairperson-icon"/>
                                        <button type='submit' className='btn btn-primary btn-lg btn-block mb-2'>ISSUE RESULTS</button>
                                        {/* Εμφάνιση μηνύματος ανάλογα με την επιτυχία ή την αποτυχία της διαδικασίας */}
                                        <label id='5' className='float-left' 
                                            style={{ 
                                                marginLeft: '15px', 
                                                color: this.props.errorTrig ? 'red' : 'green'
                                            }} 
                                        >
                                            {this.props.labelId === 5 ? this.props.txMsg : ''}
                                        </label>
                                    </div>
                                </form>
                            </div>
                        </div>
                    : <></>}
                          
                    {/* Φόρμα για την ψηφοφορία */}
                    <div className='card mb-2' id='submitVote'>
                        <form 
                            onSubmit={(event) => {
                                event.preventDefault();
                                let voterPassword = this.passInput.value.toString();                // Παίρνει την τιμή από το πεδίο του κωδικού
                                this.props.voteCandidate(this.state.candidateIndex, voterPassword); // Καλεί την συνάρτηση voteCandidate από το App.js με τα απαραίτητα δεδομένα
                            }}
                            className='mx-2 mb-2 mt-2' 
                        >
                            <div style={{borderSpace: '0 1em'}}>
                                <div className='mb-1' >
                                    <label className='float-left mt-2' style={{marginLeft: '10px'}}>
                                        <b>Please select the candidate you want to vote for: </b>
                                    </label>
                                    <select 
                                        className="form-select"
                                        value={this.state.candidateIndex} // Σύνδεση της επιλογής με το state
                                        onChange={this.handleSelectChange} // Ενημέρωση του state κατά την αλλαγή της επιλογής
                                        required
                                        style={{width: '35%'}}
                                    >
                                        <option disabled key='-1' defaultValue='-1'>Select candidate</option>
                                        {this.props.candidates && this.props.candidates.map((candidate, index) => (
                                            <option key={index} value={index}>{index+1}. {candidate.name}</option>
                                        ))}
                                    </select>
                                    <label className='float-left mt-3' style={{marginLeft: '10px'}}>
                                        <b>Please enter a secret code:</b>
                                        <span 
                                            onClick={() => alert("Your vote secret must be at least 12 characters long and contain: \n - At least one uppercase letter\n - At least one lowercase letter\n - At least one number\n - At least one special character (@$!%*?&)")}
                                            style={{ marginLeft: '5px', cursor: 'pointer', color: 'blue' }}
                                        >
                                            ℹ
                                        </span>
                                    </label>
                                    <div className='mb-3' style={{ position: 'relative', width: '35%' }}>
                                    <input 
                                        ref={(input) => { this.passInput = input }}
                                        type={this.state.inputType}
                                        placeholder="Enter a Password"
                                        required
                                        style={{ width: '100%', paddingRight: '30px' }} // Εξασφαλίζει ότι το κείμενο δεν θα καλύπτεται από το εικονίδιο
                                    />
                                    <i
                                        onClick={this.togglePasswordVisibility}
                                        style={{
                                            position: 'absolute',
                                            top: '50%', // Κεντράρισμα κατακόρυφα
                                            right: '10px', // Θέση στα δεξιά
                                            transform: 'translateY(-50%)', // Κεντράρισμα κατακόρυφα
                                            cursor: 'pointer',
                                            zIndex: 10 // Εξασφαλίζει ότι το εικονίδιο θα είναι πάνω από άλλα στοιχεία
                                        }}
                                    >
                                        {this.state.showPasswordIcon}
                                    </i>
                                </div>
                                                        <button type='submit' id="btn-vote" className='btn btn-primary btn-lg btn-block'>VOTE</button>
                                    {/* Εμφάνιση μηνυμάτων λάθους ή επιτυχίας μετά την ψηφοφορία */}
                                    <label id='3' className='float-left' 
                                        style={{ 
                                            marginLeft: '15px', 
                                            color: this.props.errorTrig ? 'red' : 'green'
                                        }} 
                                    >
                                        {this.props.labelId === 3 ? this.props.txMsg : ''}
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Φόρμα για την απόδειξη συμμετοχής του χρήστη στην ψηφοφορία */}
                    <div className='card mb-2' id='proveVote'>
                        <form 
                            onSubmit={(event) => {
                                event.preventDefault();
                                this.props.proveVote();  // Καλεί την συνάρτηση proveVote από App.js για την απόδειξη ψήφου
                            }}
                            className='mx-2 mb-1 mt-1' 
                        > 
                            <div className='mb-2'>
                                <label className='float-left my-2' style={{marginLeft: '10px'}}>
                                    <b>Press the button to prove your participation in the electoral process</b>
                                </label>
                                <br />
                                <button type='submit' id="btn-prove" className='btn btn-primary btn-lg btn-block'>
                                    PROVE YOUR VOTE
                                </button>
                                {/* Εμφανίζει μηνύματα ανάλογα με την κατάσταση της απόδειξης */}
                                <label id='6'
                                    style={{ 
                                        marginLeft: '15px', 
                                        color: this.props.errorTrig ? 'red' : 'green',
                                    }} 
                                >
                                    {this.props.labelId === 6 ? this.props.txMsg : ''}
                                </label>
                            </div>
                        </form>
                    </div> 

                    {/* Φόρμα για την εμφάνιση των τελικών αποτελεσμάτων ηλεκτρονικής ψηφοφορίας */}
                    <div className='card mb-2' id='showResults'>
                        <form 
                            onSubmit={(event) => {
                                event.preventDefault();
                                this.props.showElectionsResults();  // Καλεί την συνάρτηση showElectionsResults από App.js για την εμφάνιση των αποτελεσμάτων
                            }}
                            className='mx-2 mb-2 mt-2' 
                        >
                            <div style={{borderSpace: '0 1em'}}>
                                <label className='float-left mt-1 mb-2' style={{marginLeft: '10px'}}>
                                    <b>Press the button to show final voting results</b>
                                </label> <br/>
                                <button type='submit' className='btn btn-primary btn-lg btn-block'>
                                    SHOW RESULTS
                                </button> 
                                <div className='mt-4'>
                                    {/* Εμφανίζει τον νικητή ή μήνυμα αν δεν έχουν εκδοθεί ακόμα τα αποτελέσματα */}
                                    <label className='float-left' id='8' style={{marginLeft: '10px', fontWeight: "bold", fontSize: "18px"}}>
                                        {this.props.labelId === 8 ?
                                            (this.props.issuedResults && this.props.finalCandidates.length>0 ? 
                                                this.props.txMsg 
                                                : 
                                                <span style={{fontWeight: 'normal', color: 'red'}}>{this.props.txMsg}</span>
                                            )
                                            :
                                            ''
                                        }
                                    </label> 
                                    {/* Εμφανίζει τα τελικά αποτελέσματα σε πίνακα αν υπάρχουν */}
                                    {this.props.labelId === 8 ?
                                        (this.props.issuedResults && this.props.finalCandidates.length>0 ? 
                                            <div className='mt-1'>
                                                <br/>
                                                <table className='table table-bordered table-sm table-info text-center mx-auto' style={{ tableLayout: 'fixed' }}>
                                                    <thead>
                                                        <tr className='text-white'>
                                                            <th scope='col'>Rank</th>
                                                            <th scope='col'>Candidate Name</th>
                                                            <th scope='col'>Votes</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {this.props.finalCandidates && this.props.finalCandidates.map((finalCandidates, index) => (
                                                            <tr key={index}>
                                                                <td>{index+1}</td>
                                                                <td>{finalCandidates.name.toString()}</td>
                                                                <td>{finalCandidates.voteCount.toString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            :
                                            <></>)
                                        :
                                        <></>
                                    }
                                </div>

                            </div>
                        </form>
                    </div>                
                    <br/><br/><br/>
                </div>
            </div>
        )
    }
}

export default Main;
