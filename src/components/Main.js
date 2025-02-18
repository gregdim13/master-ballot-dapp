import React, {Component} from 'react'
import './Main.css'; 
import chairperson from "../chairperson.svg";

class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            candidateIndex: 0,   // Για να αποθηκεύσεις το επιλεγμένο candidate
        };
    }

    handleSelectChange = (event) => {
        // Αποθήκευση του επιλεγμένου candidateIndex
        this.setState({ candidateIndex: event.target.value });
    }


    // our react goes in here
    render() {
        return (
            <div id='content' className='mt-5 mx-5'>
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

                {this.props.chairperson ?
                    <div className='block mb-2'>
                        <div className='card mb-2 mt-2'>
                            <form 
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    let candidateName = this.candidateInput.value.toString();
                                    this.props.registerCandidates(candidateName)
                                }}
                                className='mx-2 mb-2 mt-2' 
                            >
                                <div style={{borderSpace: '0 1em'}}>
                                    <label className='float-left mt-2' style={{marginLeft: '10px'}}><b>Candidate Name: </b></label>
                                    <img src={chairperson} alt="ChairPerson" width="32" className="chairperson-icon"/>
                                    <div className='mb-3'>
                                        <input 
                                            ref={(input) => {this.candidateInput  = input}}
                                            type='text'
                                            placeholder='Enter Candidate Name'
                                            required
                                            style= {{width: '30%'}}
                                        />
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

                        <div className='card mb-2'>
                            <form 
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    let voterAddress = this.voterInput.value.toString()
                                    this.props.registerVoters(voterAddress)
                                }}
                                className='mx-2 mb-2 mt-2' 
                            >
                                <div style={{borderSpace: '0 1em'}}>
                                    <label className='float-left mt-2' style={{marginLeft: '10px'}}><b>Voter Address: </b></label>
                                    <img src={chairperson} alt="ChairPerson" width="32" className="chairperson-icon"/>
                                    <div className='mb-3'>
                                        <input 
                                            ref={(input) => {this.voterInput  = input}}
                                            type='text'
                                            placeholder="Enter Voter's Address"
                                            required
                                            style= {{width: '30%'}}
                                        />
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

                        <div className='card mb-2'>
                            <form 
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    //this.props.findWinner()
                                    this.props.countVotes()
                                }}
                                className='mx-2 mb-2 mt-2' 
                            >
                                <div style={{borderSpace: '0 1em'}}>
                                    <label className='float-left mt-2 mb-2' style={{marginLeft: '10px'}}><b>Press the button to issue final voting results</b></label> <br/>
                                    <img src={chairperson} alt="ChairPerson" width="32" className="chairperson-icon"/>
                                    <button type='submit' className='btn btn-primary btn-lg btn-block mb-2'>ISSUE RESULTS</button> 
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
                :
                <></>}
                          
                <div className='card mb-2'>

                    <form 
                        onSubmit={(event) => {

                            event.preventDefault();
                            let voterPassword = this.passInput.value.toString()
                            // const submittedButton = event.nativeEvent.submitter;
                            // if (submittedButton.id == "btn-vote") {
                            //     console.log("Test Test")
                            this.props.voteCandidate(this.state.candidateIndex, voterPassword)
                            // else 
                            //     this.props.proveVote();
                        }}
                        className='mx-2 mb-2 mt-2' 
                    >
                        <div style={{borderSpace: '0 1em'}}>
                            <div className='mb-1' >
                                <label className='float-left mt-2' style={{marginLeft: '10px'}}><b>Please select the candidate you want to vote for: </b></label>
                                <select 
                                    className="form-select"
                                    value={this.state.candidateIndex} // Σύνδεση με το state
                                    onChange={this.handleSelectChange} // Ενημέρωση του state όταν αλλάζει η επιλογή
                                    required
                                    style= {{width: '50%'}}
                                >
                                    <option disabled key='-1' defaultValue='-1'>Select candidate</option>
                                    {this.props.candidates && this.props.candidates.map((candidate, index) => (
                                        <option key={index} value={index}>{index+1}. {candidate.name}</option>
                                    ))}
                                </select>
                                <label className='float-left mt-3' style={{marginLeft: '10px'}}>    <b>Please enter a secret code:</b>
                                    <span 
                                        onClick={() => alert("Your vote secret must be at least 12 characters long and contain: \n - At least one uppercase letter\n - At least one lowercase letter\n - At least one number\n - At least one special character (@$!%*?&)")}
                                        style={{ marginLeft: '5px', cursor: 'pointer', color: 'blue' }}
                                    >
                                        ℹ
                                    </span>
                                </label>
                                <div className='mb-3'>
                                    <input 
                                        ref={(input) => {this.passInput = input}}
                                        type='text'
                                        placeholder="Enter a Password"
                                        required
                                        style= {{width: '30%'}}
                                    />
                                    <label id='4' className='float-left' 
                                        style={{ 
                                            marginLeft: '15px', 
                                            color: this.props.errorTrig ? 'red' : 'green'
                                        }} 
                                    >
                                        {this.props.labelId === 4 ? this.props.txMsg : ''}
                                    </label>
                                </div>

                                <button type='submit' id="btn-vote"  className='btn btn-primary btn-lg btn-block'>VOTE</button>
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
                    <form 
                        onSubmit={(event) => {
                            event.preventDefault();
                            this.props.proveVote();
                        }}
                        className='mx-2 mb-1 mt-1' 
                    > 
                        <div className='mb-2'>
                                    <button type='submit' id="btn-prove" className='btn btn-primary btn-lg btn-block'>PROVE YOUR VOTE</button>
                                    <label id='6'
                                        style={{ 
                                            marginLeft: '15px', 
                                            color: this.props.errorTrig ? 'red' : 'green',
                                        }} 
                                    >
                                        { this.props.labelId === 6 ? this.props.txMsg : '' }
                                    </label>
                        </div>
                    </form>
                </div>                       
                <div className='card mb-2'>

                    <form 
                        onSubmit={(event) => {
                            event.preventDefault()
                            this.props.showElectionsResults()
                        }}
                        className='mx-2 mb-2 mt-2' 
                    >
                        <div style={{borderSpace: '0 1em'}}>
                            <label className='float-left mt-2 mb-2' style={{marginLeft: '10px'}}><b>Press the button to show final voting results</b></label> <br/>
                            <button type='submit' className='btn btn-primary btn-lg btn-block'>SHOW RESULTS</button> 
                            <div className='mt-4'>
                                <label className='float-left' style={{marginLeft: '10px', fontWeight: "bold", fontSize: "18px"}}>

                                    { this.props.pressResults ?
                                        (this.props.issuedResults && this.props.finalCandidates.length>0 ? 
                                                'The winner is ' + this.props.finalCandidates[0].name + ' with ' + this.props.finalCandidates[0].voteCount + ' votes.' 
                                                : 
                                                'Elections results have not issued yet.'
                                        )
                                        :
                                        <></>
                                    }
                                </label> 
                                {this.props.pressResults ?
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
                    {/* <div className='card-body text-center' style={{color: 'blue'}}>
                        AIRDROP <Airdrop stakingBalance={this.props.stakingBalance}/>
                    </div> */}
                <br/><br/><br/>

            </div>
        )
    }
}

export default Main;