import React from 'react';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, FloatingActionButton, RaisedButton, CardText, List, ListItem} from 'material-ui';
import {HardwareKeyboardArrowLeft, HardwareKeyboardArrowRight, ActionList} from 'material-ui/svg-icons';
import { blueGrey50, cyan900 } from 'material-ui/styles/colors';
import keydown from 'react-keydown';
import moment from 'moment';
import {can_view_component} from '/lib/access_control';
import ImageLoader from '../../core/components/image_loader.jsx';

class EventView extends React.Component {
  constructor(props) {
    super(props);
  }

  addParticipant() {
    this.props.event.participants.push(Meteor.userId())
    this.props.update(this.props.event)
  }

  removeParticipant() {
    this.props.event.participants.splice(this.props.event.participants.indexOf(Meteor.userId()), 1)
    this.props.update(this.props.event)
  }

  @keydown( 'right' )
  goToNext(){
    this.props.goTo("next", this.props.event);
  }

  @keydown( 'left' )
  goToPrevious(){
    this.props.goTo("previous", this.props.event);
  }

  componentWillReceiveProps(nextProps){
    if(this.props.event._id != nextProps.event._id){
      this.setState({
        fileStatus: 'loading'
      })
    }
  }

  render() {
    const {event, participants, cover} = this.props
    if (!event) {
        return <div></div>
    }

    return (
      <div>
        <Card style={{backgroundColor: blueGrey50}}>
          <CardHeader
            title={moment(event.date).format('D MMMM') + ', ' +
              moment(event.start).format('HH:mm') + ' - ' +
              moment(event.end).format('HH:mm')}
            titleStyle={{verticalAlign: 'middle', lineHeight: '36px', width: 'auto'}}
          >
            {can_view_component('event.edit') ? <RaisedButton
              label="Edit"
              linkButton={true}
              href={event._id + "/edit"}
              primary={true}
              style={{float: 'right'}}
            /> : null }
          </CardHeader>

          <CardMedia
            style={{backgroundColor: '#fff'}}
          >
            <ImageLoader src={cover} />
          </CardMedia>
          <CardTitle
            title={event.title}
          />
          <CardText>
            {(()=>{
              if(event.participants.includes(Meteor.userId())){
                return(<RaisedButton backgroundColor={cyan900} labelColor='#fff' label="Totally signed up for that shizzle!" onTouchTap={this.removeParticipant.bind(this)}/>);
              }else{
                return(<RaisedButton secondary={true} label="Nahh bro, you'll do that without me..." onTouchTap={this.addParticipant.bind(this)}/>);
              }
            })()}
            <p>{event.description}</p>
          </CardText>
          {(()=>{
            if(0 < participants.length){
              return (
                <CardTitle
                  subtitle={"Participants (" + participants.length + ")"}
                  actAsExpander={true}
                  showExpandableButton={true}
                />
              )
            }
          })()}

                <CardText
                  expandable={true}
                >
                  <List>
                    {(() => {
                      return participants.map((user) => {
                        return (
                          <ListItem key={user._id}
                            primaryText={user.profile.firstname + " " + user.profile.lastname}
                          />
                        );
                      })
                    })()}
                  </List>
                </CardText>

          <CardText>
            <div style={{width: '100%', textAlign: 'center'}}>
              <FloatingActionButton onTouchTap={this.goToPrevious.bind(this)}>
                <HardwareKeyboardArrowLeft />
              </FloatingActionButton>

              <FloatingActionButton linkButton={true} href="/events" style={{margin: '0 30px'}}>
                <ActionList />
              </FloatingActionButton>

              <FloatingActionButton onTouchTap={this.goToNext.bind(this)}>
               <HardwareKeyboardArrowRight />
              </FloatingActionButton>
            </div>
          </CardText>
        </Card>
      </div>
    );
  }
}

export default EventView;
