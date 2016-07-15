import {Events} from '/lib/collections';
import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';

export default function () {
  Meteor.methods({
    'event.update'(event) {
        check(event, Object)

        // merge date-time
        const {date, start} = event;
        event.date = new Date(date.getFullYear(), date.getMonth(), date.getDate(),
            start.getHours(), start.getMinutes(), start.getSeconds());

        var eventId = event._id;
        delete event._id;
        Events.update(eventId, {$set: event})
    },
    'event.insert'(event) {
        check(event, Object)
        return Events.insert(event)
    },
    'event.remove'(event) {
        check(event, Object)
        Events.remove(event._id)
    },
    'event.getIdOf'(action, event) {
        check(action, String)
        check(event, Object)

        function getItem (type) {
          var actions = {
            'next': () => {
              const result = Events.find({date: {$gt: event.date}}, {sort: {date: 1}, limit: 1}).fetch()[0]
              // if at the end ost list return first
              if(!result){
                // get first item
                return Events.find({}, {sort: {date: 1}}).fetch()[0];
              }
              return result
            },
            'previous': () => {
              const result = Events.find({date: {$lt: event.date}}, {sort: {date: -1}, limit: 1}).fetch()[0]
              // if at the end ost list return first
              if(!result){
                // get first item
                return Events.find({}, {sort: {date: -1}}).fetch()[0];
              }
              return result
            },
          };
          return actions[type]();
        }

        // get item
        return getItem(action)._id;
    },
  });
}
