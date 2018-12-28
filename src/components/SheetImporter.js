import React, {Component} from 'react';
import GetSheetDone from 'get-sheet-done';

class SheetImporter extends Component {

    constructor() {
        super();
        this.state = {
            sheetId: '19BAGhS4Etd7Uzo7Un6C-G5rnHuhvd374dGVKU0dkmj4',
            sheetNum: '2',
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        // this.setState({url: e.target.value});
        GetSheetDone.labeledCols(this.state.sheetId, this.state.sheetNum)
            .then((data) => {
                console.log('Data');
                console.log(data);
                this.props.onSubmit(data);
            }).catch(err => {
            console.log('Error');
            console.error(err);
        });
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        <div>
                            Sheet Id:
                            <input name="sheetId" type="text" value={this.state.sheetId} onChange={this.handleChange}/>
                        </div>
                        <div>
                            Sheet Num:
                            <input name="sheetNum" type="text" value={this.state.sheetNum} onChange={this.handleChange}/>
                        </div>
                    </label>
                    <button>Submit</button>
                </form>
            </div>
        );
    }
}
export default SheetImporter;
