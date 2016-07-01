import React from 'react';
import {TextField, RaisedButton, Snackbar} from 'material-ui';
import FileList from '../containers/file_list';

const styles = {
  button: {
    margin: 12,
  },
  exampleImageInput: {
    cursor: 'pointer',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: '100%',
    opacity: 0,
  },
};

class FilePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {filterText: ''};
  }

  updateFilterText(event) {
    this.setState({
      filterText: event.target.value,
    });
  }

  upload(event){
    _.map(event.target.files, (file) => {
      var res = this.props.upload(file);
    });
  }

  // message: {type: '', content: ''}
  renderNotification(message){
    return (
      <Snackbar
        open={true}
        message={message.content}
        autoHideDuration={3000}
      />
    );
  }

  render() {
    console.log(this.props, this.state)
    const {message} = this.props

    return (
      <div className="file-page">

        {message ? this.renderNotification(message) : null}

        <TextField
          id="search"
          value={this.state.value}
          floatingLabelText="Search"
          onChange={this.updateFilterText.bind(this)}
        />
        <RaisedButton
          label="Choose an Image"
          labelPosition="before"
          style={styles.button}
        >
          <input onChange={this.upload.bind(this)} type="file" style={styles.exampleImageInput} />
        </RaisedButton>
        <FileList filterText={this.state.filterText} />
      </div>
    );
  }

  componentWillUnmount(){
    console.log("unmount")
    this.props.clearMessage();
  }
}

export default FilePage;
