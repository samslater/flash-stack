import React, {Component} from 'react';
import Lodash from 'lodash';
import Axios from 'axios';
import SheetImporter from './SheetImporter'
import JsonToCsv from 'json2csv'


const sequenceSize = 10;
const cardCorrectStreak = 3;
const reviewNewSplit = .5; //50% new
const isNewCardsRandom = false;
const myJsonAPIKey = 'xljek'

class Tester extends Component {

    constructor() {
        super();
        this.state = {
            url: '',
            cards: [],
            currentSequence: [],
            currentSequenceId: null,
            currentCardIdx: null,
            activeFace: null
        };

        this.handleImport = this.handleImport.bind(this);
        this.handleCardButtonClick = this.handleCardButtonClick.bind(this);
        this.setNewSequence = this.setNewSequence.bind(this);
        this.handleCardFaceClick = this.handleCardFaceClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    componentDidMount() {

        // try {
        //     Axios.get('https://api.myjson.com/bins/xljek')
        //         .then((response) => {
        //             this.setState({
        //                 cards: response.data
        //             });
        //         })
        // }
        // catch (e) {
        //     console.log(e)
        // }

        document.addEventListener("keydown", this.handleKeyDown, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyDown, false);
    }

    handleImport(response) {

        const cards = response.data.map((card)=> {
            if (card.events) {
                card.events = JSON.parse(card.events);
            }
            return card;
        });

        this.setState({cards: response.data});

        this.setNewSequence(cards);
    }

    saveCards() {
        try {
            Axios.put('https://api.myjson.com/bins/xljek', JSON.stringify(this.state.cards)).then((response) => {
                console.log(response)
            })
        }
        catch (e) {
            console.log(e)
        }
    }

    getLastEvent(card) {

        if (!this.state.events.length) {
            return;
        }

        const cardEvents = this.state.events.filter((item) => {
            return card.front === item.front && card.back === item.back;
        });

        if (!cardEvents.length) {
            return;
        }

        return this.sortEvents(cardEvents)[0];
    }

    sortEvents(cardEvents) {
        return cardEvents.sort((a, b) => {
            return new Date(b.timeStamp) - new Date(a.timeStamp);
        });
    };


    handleCardButtonClick(e) {

        const card = this.getCurrentCard();

        const event = {
            timeStamp: new Date().getTime(),
            type: e.currentTarget.dataset.id,
            sequenceId: this.state.currentSequenceId
        };

        if (!card.events) {
            card.events = [];
        }

        card.events.unshift(event);

        const cards = this.state.cards.map((cur, idx, src) => {
            return idx === this.state.currentCardIdx ? card : cur;
        });

        this.setState({
            cards: cards
        });

        this.setNextCard();

    }

    isCardDone(cardIndex) {

        const sequenceId = this.state.currentSequenceId;
        const card = this.state.cards[cardIndex];

        if (Lodash.isNil(card)) {
            console.log(`no card for index: ${cardIndex}`);
            return false;
        }

        if (Lodash.isEmpty(card.events)) {
            return false;
        }

        if (Lodash.isNil(sequenceId)) {
            return false;
        }

        const sequenceEvents = card.events.filter((event)=> {
            return event.sequenceId == sequenceId;
        });

        if (Lodash.isEmpty(sequenceEvents)) {
            return false;
        }

        const streaks = sequenceEvents.reduce((acc, cur, idx, src) => {

            let streakAddition = {};

            if (cur.type == 'know' || cur.type == 'got') {
                streakAddition.type = 'correct';
                streakAddition.value = 1;
            } else {
                streakAddition.type = 'incorrect';
                streakAddition.value = 1;
            }

            if (!acc.length) {
                acc.push(streakAddition)
            } else {
                let currentStreak = acc[acc.length - 1];
                if (streakAddition.type == currentStreak.type) {
                    currentStreak.value = currentStreak.value + streakAddition.value;
                    acc[acc.length - 1] = currentStreak;
                } else {
                    acc.push(streakAddition)
                }
            }
            return acc;
        }, []);

        if (streaks[0].type == 'incorrect') {
            return false;
        }

        return streaks[0].value >= cardCorrectStreak;

    }


    handleCardFaceClick() {
        this.setState({
            activeFace: this.state.activeFace === 'back' ? 'front' : 'back'
        });
    }

    getRankedCardsWorstFirst(cards) {
        // _.orderBy(users, ['user', 'age'], ['asc', 'desc']);

        return cards.orderBy((item)=> {
            return !item.events || !item.events.length
        }, (item)=> {
            return !item.events || !item.events.length
        })


    }

    setNewSequence() {

        const cards = this.state.cards;

        const newCardCount = Math.floor(sequenceSize * reviewNewSplit);
        const reviewCardCount = sequenceSize - newCardCount;

        let nextSequenceIdxArray = cards.reduce((acc, cur, idx, src)=> {

            if (acc.length > newCardCount) {
                return acc;
            }

            if (Lodash.isEmpty(cur.events)) {
                return [...acc, idx]
            }

            return acc

        }, []);

        if (Lodash.isEmpty(nextSequenceIdxArray)) {
            nextSequenceIdxArray = cards.reduce((acc, cur, idx, src)=> {

                if (acc.length > newCardCount) {
                    return acc;
                }

                //Take the first indexes
                return [...acc, idx]

            }, []);
        }

        console.log(`Setting new sequence ${JSON.stringify(nextSequenceIdxArray)}`);

        this.setState({
            currentSequenceId: new Date().getTime(),
            currentSequence: nextSequenceIdxArray
        });

        this.setNextCard();
    }

    isCardButtonEnabled() {
        return this.state.activeFace === 'back';
    }

    handleKeyDown(e) {
        return;
        // console.log(e);

        // if (e.key == 'f') {
        //
        // }
    }

    getNextCardIndex() {

        const shuffledSequence = Lodash.shuffle(this.state.currentSequence);

        console.log(`Getting next card index from sequestion ${JSON.stringify(shuffledSequence)}`);

        const nextCardIdx = Lodash.find(shuffledSequence, (item)=> {
            return !this.isCardDone(item);
        });

        console.log(`Returing next card index ${JSON.stringify(nextCardIdx)}`);

        return nextCardIdx;
    }

    setNextCard() {

        const nextCardIdx = this.getNextCardIndex();

        this.setCardData(nextCardIdx);

        if (typeof nextCardIdx == 'undefined') {
            this.setNewSequence();
        } else {
            this.setState({
                currentCardIdx: nextCardIdx,
                activeFace: 'front'
            });
        }

    }

    setCardData(cardIdx) {


        console.log(`Setting card data: ${JSON.stringify(cardIdx)}`);

        if (Lodash.isNil(cardIdx)) {
            return;
        }

        const card = this.state.cards[cardIdx];


        if (Lodash.isNil(card)) {
            return;
        }

        if (card.wikiurl) {

            const pageId = card.wikiurl.replace('https://en.wikipedia.org/wiki/', '');

            Axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${pageId}`).then((response)=> {

                console.log(response.data);

                card.front = response.data.description;
                card.back = response.data.displaytitle;

                let extract = response.data.extract;

                extract = extract.replace(new RegExp(response.data.titles.canonical, 'g'), response.data.titles.canonical.replace(/[\s\S]/g, '_')) ;
                extract = extract.replace(new RegExp(response.data.titles.display, 'g'), response.data.titles.display.replace(/[\s\S]/g, '_')) ;
                extract = extract.replace(new RegExp(response.data.titles.normalized, 'g'), response.data.titles.normalized.replace(/[\s\S]/g, '_')) ;


                card.front = card.front + ' ----- ' + extract;

                const cards = this.state.cards.map((cur, idx, src) => {
                    return idx === cardIdx ? card : cur;
                });

                this.setState({
                    cards: cards
                });


            });

        }
    }

    getCurrentCard() {

        if (Lodash.isEmpty(this.state.cards)) {
            console.log('no cards');
            return;
        }

        if (Lodash.isNil(this.state.currentCardIdx)) {
            console.log('no current card');
            return;
        }

        return this.state.cards[this.state.currentCardIdx];
    }

    getCardFace() {

        const card = this.getCurrentCard();

        if (Lodash.isNil(card)) {
            return;
        }

        if (this.state.activeFace === 'front') {
            console.log('front');
            return card.front
        }

        if (this.state.activeFace === 'back') {
            console.log('back');
            return card.back
        }

    }

    getDownloadData() {
        var csv = JsonToCsv.parse(this.state.cards, {fields: ["front", "back", "name", "birthday", "events"]});
        return 'data:csv/plain;charset=utf-8,' + encodeURIComponent(csv);
    }

    getOutputJson() {
        return JSON.stringify(this.state.cards);
    }

    cardButtons() {
        return <div className="card__button-group">
            <div className="o-layout">
                <div className="o-layout__item u-width-1o2">
                    <button className="card__button card__button--small"
                            data-id="dump"
                            disabled={!this.isCardButtonEnabled()}
                            onClick={this.handleCardButtonClick}>Dump
                    </button>
                </div>
                <div className="o-layout__item u-width-1o2">
                    <button className="card__button card__button--small"
                            data-id="know"
                            disabled={!this.isCardButtonEnabled()}
                            onClick={this.handleCardButtonClick}>Know
                    </button>
                </div>
            </div>
            <div className="o-layout">
                <div className="o-layout__item u-width-1o2">
                    <button className="card__button"
                            data-id="miss"
                            disabled={!this.isCardButtonEnabled()}
                            onClick={this.handleCardButtonClick}>Miss
                    </button>
                </div>
                <div className="o-layout__item u-width-1o2">
                    <button className="card__button"
                            data-id="got"
                            disabled={!this.isCardButtonEnabled()}
                            onClick={this.handleCardButtonClick}>Got
                    </button>
                </div>
            </div>
        </div>
    }


    render() {
        return (
            <div className="u-padding">

                <SheetImporter onSubmit={this.handleImport}/>

                <textarea name="outputJson" readOnly value={this.getOutputJson()}/>

                <a href={this.getDownloadData()} download="my_data.csv">my_data.csv</a>

                <div className="card" onKeyDown={this.handleKeyDown}>
                    {this.cardButtons()}
                    <div className="card__face" onClick={this.handleCardFaceClick}>{this.getCardFace()}</div>
                </div>

            </div>
        );
    }
}
export default Tester;
