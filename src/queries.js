import { gql } from '@apollo/client';

/* construct graphql queries */
const GET_WEBSITES_QUERY = gql`
  {
    getWebsites {
       id
       url
       monitered
       latestStatus
       title
    }
  }
`

const CHECK_STATUS = gql`
  query checkStatus($websiteId: ID!) {
    checkStatus(websiteId: $websiteId) {
      statusCode
      timestamp
    }
  }
`;

const CREATE_WEBSITE = gql`
  mutation createWebsite($url: String!, $email: String, $title: String) {
    createWebsite(url: $url, email: $email, title: $title) {
      id
      url
      monitered
      latestStatus
    }
  }
`;

const DELETE_WEBSITE = gql`
  mutation deleteWebsite($websiteId: ID!) {
    deleteWebsite(websiteId: $websiteId)
  }
`;

const START_MONITORING = gql`
  mutation startMonitoring($websiteId: ID!) {
    startMonitoring(websiteId: $websiteId) {
      statusCode
      timestamp
    }
  }
`;

const STOP_MONITORING = gql`
  mutation stopMonitoring($websiteId: ID!) {
    stopMonitoring(websiteId: $websiteId) {
      id
      url
      latestStatus
      monitered
    }
  }
`;

const GET_REPORT = gql`
  mutation getReport($websiteId: ID!) {
    getReport(websiteId: $websiteId) {
      id
      url
      history {
        statusCode
        timestamp
      }
    }
  }
`

export {
  GET_WEBSITES_QUERY,
  CHECK_STATUS,
  CREATE_WEBSITE,
  DELETE_WEBSITE,
  START_MONITORING,
  STOP_MONITORING,
  GET_REPORT
};
