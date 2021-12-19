import reactRefresh from '@vitejs/plugin-react-refresh'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  plugins: [reactRefresh()]
}