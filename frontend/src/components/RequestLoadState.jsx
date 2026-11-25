export default function RequestLoadState({loading,error,onRetry}) {
 if(loading)return <p role="status">Loading cases…</p>;
 if(!error)return null;
 return <div role="alert" style={{padding:12,margin:'12px 0',background:'#fff1f2',color:'#991b1b'}}>{error} <button onClick={onRetry}>Retry</button></div>;
}
