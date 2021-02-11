import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { withStyles } from '@material-ui/core/styles';
import ShowMoreText from 'react-show-more-text';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBinoculars } from '@fortawesome/free-solid-svg-icons'
import { faBed } from '@fortawesome/free-solid-svg-icons'
import { faPoll } from '@fortawesome/free-solid-svg-icons'

import Modal from './Modal';

import {
  GET_WEBSITES_QUERY,
  CHECK_STATUS,
  DELETE_WEBSITE,
  START_MONITORING,
  STOP_MONITORING,
  GET_REPORT
} from './queries';

const StyledTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'white',
    maxWidth: 250,
    fontSize: theme.typography.pxToRem(14),
  },
}))(Tooltip);

const statusStyle = (color) => {
  return `
      0 0 2px ${color},
      0 0 5px ${color},
      0 0 10px ${color}
    `;
}

export default function Moniter({ website }) {
  const UP = "#73EC5B";
  const DOWN = "#EC4067";
  const REST = "#A4A9B7";

  const getStatus = () => {
    if(website.monitered) {
      if(website.latestStatus === 200)
        return UP;
      else
        return DOWN;
    }
    else
      return REST;
  }

  const chartOptions = {
    chart: {
      width: 'auto',
      height: 'auto',
      title: `Downtime Report: ${website.url}`,
    },
    legend: {
      visible: true
    },
    series: {
      selectable: true,
      dataLabels: {
        visible: true,
        pieSeriesName: {
          visible: true,
          anchor: 'outer'
        }
      }
    },
    tooltip: {
      offsetX: -150,
      offsetY: -200
    },
    theme: {
      title: {
        fontWeight: 700
      }
    },
    responsive: {
      animation: { duration: 300 },
      rules: [
        {
          condition: ({ width: w }) => {
            var h = window.innerHeight;
            return w <= 400 || h <= 450;
          },
          options: {
            chart: {
              title: 'Downtime Report'
            },
            legend: {
              visible: false
            },
            series: {
              selectable: true,
              dataLabels: {
                visible: true,
                pieSeriesName: {
                  visible: 'true',
                  anchor: 'outer'
                }
              }
            },
          }
        }
      ]
    }
  };


  const chartRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [openChart, setOpenChart] = useState(false);
  const [state, setState] = useState(getStatus());

  const clickOutsideCB = () => {
      openChart && setOpenChart(false);
  }

  const [startMonitoring, { loading: loadingStart }] = useMutation(START_MONITORING, {
    update(proxy, result) {
      if(result.data.startMonitoring) {
        if(result.data.startMonitoring.statusCode === 200) {
          setState(UP);
          return;
        }
      }

      setState(DOWN);
    },
    variables: { websiteId: website.id }
  });

  const { data, stopPolling, startPolling } = useQuery(CHECK_STATUS, {
    variables: { websiteId: website.id }
  });

  useEffect(() => {
    const _10min = 1000 * 60 * 10;
    (state !== REST) && startPolling(_10min);
    return () => {
      stopPolling();
    };
  }, [state]);

  useEffect(() => {
    if(!data || state === REST) return;
    const statusCode = data.checkStatus.statusCode;
    const status = statusCode === 200 ? UP : DOWN;
    if(status === state) return;
    setState(status);
  }, [data]);

  const [stopMonitoring] = useMutation(STOP_MONITORING, {
    update(proxy) {
      stopPolling();
      setState(REST);
    },
    variables: { websiteId: website.id }
  });

  const [deleteWebsite] = useMutation(DELETE_WEBSITE, {
    update(proxy) {
      // remove the deleted website from the local cache
      const data = proxy.readQuery({
        query: GET_WEBSITES_QUERY
      });

      const res = data.getWebsites.filter(web => web.id !== website.id);

      // update the cache
      proxy.writeQuery({
          query: GET_WEBSITES_QUERY,
          data: {
            getWebsites: [...res]
          }
      });
    },
    variables: { websiteId: website.id }
  });

  const [getReport, { data: report }] = useMutation(GET_REPORT, {
    variables: { websiteId: website.id }
  });


  useEffect(() => {
    if(!report) return;

    const reducer = (acc, cur) => {
      if(cur.statusCode === 200) acc[0].data++;
      else acc[1].data++;
      return acc;
    }

    const series = report.getReport.history.reduce(reducer, [
      { name: 'Uptime', data: 0 },
      { name: 'Downtime', data: 0}
    ]);

    setChartData({ series });
    setOpenChart(true);
  }, [report]);


  const statusMsg = (status) => {
    if(status === UP)
      return "This website is up and running.";
    else if(status === DOWN)
      return "This website is currently down.";
    else
      return "This website is not being monitered.";
  }

  return (
      <div className="moniter">
        { openChart &&
            <Modal
              forwardRef={chartRef}
              data={chartData}
              options={chartOptions}
              onClose={clickOutsideCB}
            />
        }
        <div className="moniter-top">
          {
            loadingStart ?
              <StyledTooltip title={'Checking...'} placement="right">
                <CircularProgress size={20} style={{ color: 'white' }}/>
              </StyledTooltip>
              :
              <StyledTooltip title={statusMsg(state)} placement="right">
                <div className="status">
                  <span
                    style={{ backgroundColor: `${state}`,
                    boxShadow: state !== REST ? statusStyle(state) : 'none' }}>
                  </span>
                </div>
              </StyledTooltip>
          }
          <div className="delete" onClick={deleteWebsite}>
            <IconButton size="small">
              <CloseIcon style={{ color: 'white' }}/>
            </IconButton>
          </div>
        </div>
        <div className="moniter-body">
          <div className="body-title"><span>{website.title}</span></div>
          <div className="body-url">
            <ShowMoreText
                lines={5}
                more='Show more'
                less='Show less'
                className='content-css'
                anchorClass='body-anchor'
                expanded={false}
            >
              {website.url}
            </ShowMoreText>
          </div>
        </div>
        <div className="moniter-btns">
          <div className="start">
            <button onClick={startMonitoring} disabled={state !== REST || loadingStart}>
              <span>Start</span>
              <span><FontAwesomeIcon icon={faBinoculars} size="lg" /></span>
            </button>
          </div>
          <div className="stop">
            <button onClick={stopMonitoring} disabled={state === REST || loadingStart}>
              <span>Stop</span>
              <span><FontAwesomeIcon icon={faBed} size="lg" /></span>
            </button>
          </div>
          <div className="generate">
            <button onClick={getReport}>
              <span>Generate Report</span>
              <span><FontAwesomeIcon icon={faPoll} size="lg" /></span>
            </button>
          </div>
        </div>
      </div>
  );
}
