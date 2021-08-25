import React, { useEffect, useRef, useState } from 'react'
import AdminLayout from './layout';
import G6, { Graph, GraphData } from "@antv/g6";
import { useParams, useHistory } from 'react-router-dom'
import ReactDOM from 'react-dom'
import useSWR from 'swr';
import type { Level, LevelMap, Game } from '@cyberrun/core'
import instance from '../../components/instance';
import { Box, Popover, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, TextField } from '@material-ui/core'
import { toast } from 'react-toastify';


interface IProps {
  id: string
  onSave: () => any
}

const LevelMapEditDialog: React.FunctionComponent<IProps> = ({ id, onSave }) => {
  const { data } = useSWR<string[]>(`/admin/games/any/maps/${id}`, {
    revalidateOnFocus: false,
    revalidateOnMount: true
  })
  const [input, setInput] = useState('')
  const submit = async () => {
    await instance({
      url: `/admin/games/any/maps/${id}`,
      method: 'post',
      data: input.split("\n")
    })
    toast.success("保存成功")
    onSave()
  }

  useEffect(() => {
    if (data) {
      setInput(data.join('\n'))
    }
  }, [data])

  return <div>
    <Dialog open={true}>
      <DialogTitle>修改路径</DialogTitle>
      <DialogContent>
        <Typography>文本框内可输入正则匹配, 两侧不用加<code>/</code>, <b>必须使用<code>^</code>开头及<code>$</code>结尾</b></Typography>
        <Typography>换行分割多个输入</Typography>
        <TextField multiline fullWidth variant="outlined" value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={async () => {
          onSave()
        }}>取消</Button>
        <Button onClick={submit}>保存</Button>
      </DialogActions>
    </Dialog>
  </div>
}

const MapPage = () => {
  type Resp = {
    levels: Level[]
    maps: LevelMap[]
  }
  const ref = useRef(null)
  const { id } = useParams<{ id: string }>()
  const { data, isValidating, mutate } = useSWR<Resp>(`/admin/games/${id}/maps`)
  const dataRef = useRef<Resp>()
  const history = useHistory()
  const { data: gameData } = useSWR<Game>(`/admin/games/${id}`)
  const gameDataRef = useRef<Game>(null)
  const graph = useRef<Graph | null>(null)

  const [editingMap, setEditingMap] = useState('')

  useEffect(() => {
    if (data) {
      dataRef.current = data
    }
    if (graph.current && !isValidating) {
      console.log(data)
      let render: GraphData = {
        nodes: data?.levels.map(v => ({
          id: v._id.toString(),
          label: v.title,
          x: v.mapPoint?.x ?? 0,
          y: v.mapPoint?.y ?? 0,
          type: ["start", "end"].includes(v.type) ? "rect" :
            (v.type === "meta" ? "diamond" : "circle")
        })),
        edges: data?.maps.map(v => ({
          id: v._id.toString(),
          source: v.fromLevelId.toString(),
          target: v.toLevelId.toString(),
          style: {
            endArrow: true
          },
          label: v.answers.length.toString(),
          labelCfg: {
            autoRotate: true,
            style: {
              stroke: 'white',
              lineWidth: 5,
              fill: '#1f1e33',
              fontSize: 20
            }
          }
        }))
      }
      graph.current.data(render);
      graph.current.render();
    }

  }, [data, ref])
  useEffect(() => {
    if (gameData) {
      gameDataRef.current = gameData
    }
  }, [gameData])

  const submitPosChange = (levelId: string, x: number, y: number) => {
    console.log(levelId, x, y)
    instance({
      url: `/admin/games/${id}/maps/${levelId}/mapPoint`,
      method: 'post',
      data: {
        x, y
      }
    })
  }

  const deleteLevel = async (id: string) => {
    setEditing('')

    editingRef.current = ''
    await instance({
      url: `/admin/levels/${id}`,
      method: 'delete'
    })
    await mutate()
  }

  const editLevel = (levelId: string) => {
    history.push(`/admin/${id}/levels/${levelId}`)
    setEditing('')
    editingRef.current = ''
  }

  useEffect(() => {
    if (!graph.current) {
      graph.current = new G6.Graph({
        // @ts-ignore
        container: ReactDOM.findDOMNode(ref!.current),
        height: 1080,
        width: 1920,
        defaultNode: {
          shape: "circle",
          size: [70],
          color: "#5B8FF9",
          style: {
            fill: "#9EC9FF",
            lineWidth: 3
          },
          labelCfg: {
            style: {
              fill: "#fff",
              fontSize: 20
            }
          }
        },
        defaultEdge: {
          style: {
            stroke: "#e2e2e2",
            lineWidth: 5
          }
        },
        modes: {
          default: ["drag-node"]
        },
        nodeStateStyles: {
          hover: {
            fill: "lightsteelblue"
          },
          click: {
            stroke: "#000",
            lineWidth: 3
          }
        },
        edgeStateStyles: {
          click: {
            stroke: "steelblue"
          }
        },
        layout: {
          preventOverlap: true,
          linkDistance: 200
        },
      });
      graph.current.on("click", async (e) => {
        if (e.item) return;
        // add new
        await instance({
          url: `/admin/levels`,
          method: 'post',
          data: { x: e.canvasX, y: e.canvasY, gameId: id }
        })
        mutate()
      });
      graph.current.on("edge:click", async (e) => {
        // @ts-ignore
        setEditingMap(e.item?.getID()!)
      });
      graph.current.on("node:click", async (e) => {
        if (editingRef.current) {
          const level = dataRef.current!.levels.find(v => v._id.toString() === editingRef.current)!
          const newLevel = dataRef.current!.levels.find(v => v._id.toString() === e.item?.getID()!)!
          editingRef.current = ''
          if (!level || !newLevel) {
            return;
          }
          if (newLevel.type === "start") {
            toast.error("目标关卡不能是起始关")
            return
          }
          if (level.type === "end" || level.type === "meta") {
            toast.error("不能由结束关创建路径")
            return
          }
          if (gameDataRef.current?.type === "meta" && newLevel.type !== "meta") {
            toast.error("meta赛仅允许终点为meta关")
            return;
          }
          if (newLevel._id === level._id) {
            return toast.error("?")
          }
          if(dataRef.current!.maps.find(v => v.fromLevelId === level._id && v.toLevelId === newLevel._id)){
            return toast.error("路径已存在!")
          }
          await instance({
            url: `/admin/games/${id}/maps`,
            method: 'post',
            data: {
              fromLevelId: level._id.toString(),
              toLevelId: newLevel._id.toString()
            }
          })
          mutate()

          return;
        }
        setPosition({
          top: e.clientY, left: e.clientX
        })
        setEditing(e.item?.getID()!)
        editingRef.current = e.item?.getID()!
        setOpen(true)
      });
      graph.current.on("node:dragend", (e) => {
        // @ts-ignore
        submitPosChange(e.item?.getID(), e.item?.getBBox().centerX, e.item?.getBBox().centerY)
      })
    }
    graph.current.render();
  }, [])
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({
    top: 0, left: 0
  })
  const [editing, setEditing] = useState('')
  const editingRef = useRef('')
  return <AdminLayout>
    {Boolean(editingMap) && <LevelMapEditDialog
      id={editingMap} onSave={() => {
        setEditingMap('')
        mutate()
      }}
    />}
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <img src={gameData?.map} style={{
        position: 'absolute', zIndex: -1,
        height: '100%', width: '100%'
      }}></img>
      <Popover anchorReference="anchorPosition" anchorPosition={position} open={open} onClose={() => {
        setEditing('')
        editingRef.current = ''
        setOpen(false)
      }} transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}>
        <Box p={2} onClick={() => {
          setOpen(false)
        }}>
          <Button>新增路径</Button>
          <Button onClick={() => editLevel(editing)}>编辑关卡</Button>
          <Button onClick={() => deleteLevel(editing)}>删除关卡</Button>
        </Box>
      </Popover>
    </div>
  </AdminLayout>
}

export default MapPage;