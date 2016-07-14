import * as notification from 'notie';
import { Accounts } from 'meteor/accounts-base';

export default {
  login({Meteor, FlowRouter}, email, password) {
    Meteor.loginWithPassword(email, password, (err, res) => {
      if(err){
        notification.alert(3, err.message, 2.5);
      }else{
        notification.alert(1, 'You successfully logged in.', 2.5);
        FlowRouter.go('/events');
      }
    });
  },
  insert({Meteor, FlowRouter}, user){
    Accounts.createUser(user, (err, res) => {
     if(err){
       notification.alert(3, err.message, 2.5);
     }
   });
  }
}