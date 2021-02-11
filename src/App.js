import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@apollo/client';
import CircularProgress from '@material-ui/core/CircularProgress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWatchmanMonitoring } from '@fortawesome/free-brands-svg-icons'

import { GET_WEBSITES_QUERY, CREATE_WEBSITE } from './queries';
import Moniter from './Moniter';
import './App.css';

const URL = 'https://downtime-alert.herokuapp.com';
const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function App() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [isServerUp, setServerUp] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
      fetch(URL, { method: 'GET' })
        .then(res => setServerUp(true))
        .catch(err => console.log(err));
  }, []);

  const { loading, data } = useQuery(GET_WEBSITES_QUERY);
  const [submitWebsite, { loading: loadingNewWebsite }] = useMutation(CREATE_WEBSITE, {
    update(proxy, result) {
      // update the local cache with the newly created website
      const data = proxy.readQuery({
        query: GET_WEBSITES_QUERY
      });

      proxy.writeQuery({
          query: GET_WEBSITES_QUERY,
          data: {
            getWebsites: [...data.getWebsites, result.data.createWebsite]
          }
      });
    },
    onError(err) {
      enqueueSnackbar(err.message, {
        variant: 'error',
        autoHideDuration: 5000,
      });
    },
    variables: {
      url,
      email: email.trim() !== '' ? email : null,
      title: title.trim() !== '' ? title : null,
    }
  });

  const action = key => (
    <div
      onClick={() => closeSnackbar(key)}
      style={{
        left: 0,
        top: 0,
        position: 'absolute',
        width: '100%',
        height: '100%'
    }}>
    </div>
  );

  const handleAddMoniter = (e) => {
    e.preventDefault();
    // validate email format
    if(email.trim() !== '' && !regex.test(email)) {
      enqueueSnackbar('Invalid email.', {
        variant: 'error',
        autoHideDuration: 5000,
        action
      });
      return;
    }

    if(url.trim() !== ''){
      submitWebsite();
    }

    setUrl('');
    setEmail('');
    setTitle('');
  }

  return (
    <div className="App">
      <div id="add-website"
        style={{
          opacity: (loadingNewWebsite ? 0.7 : 1 ),
          pointerEvents: (loadingNewWebsite ? 'none' : 'auto' )
        }}>
        <FontAwesomeIcon
          icon={faWatchmanMonitoring}
          size="3x"
          color="white"
          inverse
          border
          style={{
            height: '50px',
            backgroundColor: '#18334E',
            borderColor: '#18334E',
          }}
        />
        <div>
          <form onSubmit={handleAddMoniter}>
            <input
              type="text"
              placeholder="Website (url)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label>
              You will be notified via email when the website is down.
              <input
                type="text"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
           <input type="submit" value="Add" disabled={url.trim() === ''} />
          </form>
        </div>
      </div>
      <div className="moniters-container">
        {
          !loading && isServerUp ? (
            data && data.getWebsites.length > 0 &&
            data.getWebsites.map(website => (
              <Moniter key={website.id} website={website} />
            ))
          ) : (
            <div
              style={{
                alignSelf: 'center',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: 'white',
                fontWeight: 600,
              }}
            >
              <CircularProgress size={60} style={{ color: 'white' }}/>
              {!isServerUp && <span style={{ marginTop: '10px' }}>Waiting for server to wake up...</span>}
            </div>
          )
        }
      </div>
    </div>
  );
}

export default App;
