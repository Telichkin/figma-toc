import './App.css';
import React from 'react';

const ACCESS_TOKEN_KEY = '__fat__';
const PROJECTS = [
  {
    "id": "26071055",
    "name": "🎨 In Progress"
  },
  {
    "id": "19821474",
    "name": "💡 New Features"
  }
];

class App extends React.Component {
  state = {
    token: '',
    stage: 'UNKNOWN',
    filesMap: {},  // { projectId: { key, name, thumbnail_url }[] }
    canvasesMap: {},  // { fileId: { id, name }[] }
  }

  componentDidMount() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      this.setState({ stage: 'NO_TOKEN', token: '' });
    } else {
      this.setState({ stage: 'FETCHING', token }, () => this.fetchData());
    }
  }

  handleTokenChange = (e) => {
    const { value } = e.currentTarget;
    this.setState({ token: value });
  }

  handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem(ACCESS_TOKEN_KEY, this.state.token);
    this.setState({ stage: 'FETCHING' });
    this.fetchData();
  }

  fetchData = async () => {
    try {
      await Promise.all(PROJECTS.map(({ id }) => this.handleFetchFiles(id)));
      this.setState({ stage: 'FETCHED' });
    } catch (err) {
      this.setState({ stage: 'ERROR' });
    }
  }

  handleFetchFiles = async (projectId) => {
    const resp = await fetch(`https://api.figma.com/v1/projects/${projectId}/files`, {
      method: 'GET',
      headers: {
        'X-FIGMA-TOKEN': this.state.token,
      },
    });
    if (resp.status === 200) {
      const json = await resp.json();
      const files = json.files || [];
      this.setState(state => ({ 
        filesMap: { 
          ...state.filesMap, 
          [projectId]: files,
        }
      }));
      await Promise.all(files.map(f => this.handleFetchCanvases(f.key)));
    } else {
      throw Error(resp.status);
    }
  }

  handleFetchCanvases = async (fileId) => {
    const resp = await fetch(`https://api.figma.com/v1/files/${fileId}?depth=1`, {
      method: 'GET',
      headers: {
        'X-FIGMA-TOKEN': this.state.token,
      },
    });
    if (resp.ok) {
      const json = await resp.json();
      const canvases = ((json.document && json.document.children) || []).map(c => ({ id: c.id, name: c.name }));
      this.setState(state => ({
        canvasesMap: {
          ...state.canvasesMap,
          [fileId]: canvases,
        }
      }))
    }
  }

  render() {
    const { state, handleTokenChange, handleLogin } = this;

    if (state.stage === 'NO_TOKEN' || state.stage === 'FETCHING' || state.stage === 'ERROR') {
      return (
        <div className="px-16 py-16 flex flex-col justify-center items-center">
          <h1 className="font-semibold text-6xl mb-2">
            Hi there 👋
          </h1>
          <h2 className="text-2xl text-gray-700 max-w-xl text-center mb-4">
            <p className="mb-1">Please, enter you personal access token to continue.</p>
            <p className="text-base">Do not have access token? Check <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noreferrer" className="text-blue-700 underline ">Figma documentation</a>!</p>
          </h2>
          <form onSubmit={handleLogin} className="flex justify-center w-full max-w-xl space-x-2">
            <input disabled={state.stage === 'FETCHING'} type="password" value={state.token} onChange={handleTokenChange} placeholder="Access Token" className="rounded border border-gray-300 text-base px-4 py-2 flex-grow flex-shrink" />
            <button disabled={state.stage === 'FETCHING'} type="submit" className="px-6 flex items-center font-semibold bg-blue-700 text-white rounded flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
              Login
            </button>
          </form>
          {state.stage === 'ERROR' ? (
            <div className="text-sm text-red-700 mt-1">
              Ooops... Looks like your token is incorrect 
            </div>
          ) : null}
          {state.stage === 'FETCHING' ? (
            <div className="mt-8 flex flex-col items-center">
              <p className="mb-4">
                Fetching your data...
              </p>
              <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
            </div>
          ) : null}
        </div>
      )
    }

    if (state.stage === 'FETCHED') {
      return (
        <div className="px-16 py-16 flex flex-col justify-center items-center">
          <h1 className="font-semibold text-6xl mb-2">
            Table of Content
          </h1>
          <div className="space-y-12 mt-8 text-lg flex flex-col items-start w-full">
            {PROJECTS.map(({ id, name: pName }) => (
              <div className="border-b border-gray-300 pb-12">
                <div key={id} className="cursor-default mb-6 py-2 sticky top-0 text-2xl text-center bg-white">
                  {pName}
                </div>
                {state.filesMap[id] ? (
                  <div className="ml-2 flex justify-center items-start flex-wrap">
                    {state.filesMap[id].map(({ key, name: fName, thumbnail_url }) => (
                      <div key={key} className="flex-shrink-0 w-96 text-sm mr-4 mb-4 truncate rounded border border-gray-300 px-4 py-4">
                        <div className="-mt-4 -mx-4 rounded-t">
                          <img src={thumbnail_url} alt="" className="max-w-full" />
                        </div>
                        <div className="font-semibold mt-2">
                          {fName}
                        </div>
                        {state.canvasesMap[key] ? (
                          <div className="mt-1 space-y-1">
                            {state.canvasesMap[key].map(({ id, name }) => (
                              <a href={`https://www.figma.com/file/${key}/?node-id=${id}`} target="_blank" rel="noreferrer" key={id} className="underline text-blue-500 block truncate">
                                {name}
                              </a>
                            ))}
                          </div>
                        ) : null}

                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  }
}

export default App;
