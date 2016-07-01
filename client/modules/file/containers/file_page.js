import {useDeps, composeAll, composeWithTracker, compose} from 'mantra-core';

import FilePage from '../components/file_page.jsx';

export const composer = ({context}, onData) => {
  const {Meteor, Collections, LocalState} = context();
  var message = LocalState.get('message');
  onData(null, {message});
};

export const depsMapper = (context, actions) => ({
  context: () => context,
  upload: actions.files.upload,
  clearMessage: actions.files.clearMessage,
});

export default composeAll(
  composeWithTracker(composer),
  useDeps(depsMapper)
)(FilePage);
